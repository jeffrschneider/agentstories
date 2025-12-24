/**
 * LangGraph Adapter
 *
 * Generates Python code for LangGraph agent graphs.
 * Creates graph state, node functions, edge logic, and tool definitions.
 *
 * See: https://langchain-ai.github.io/langgraph/
 */

import type { AgentStory } from '@/lib/schemas/story';
import type { Skill } from '@/lib/schemas/skill';
import { generateSlug } from '@/lib/schemas/skill';
import type {
  HarnessAdapter,
  HarnessCompatibility,
  HarnessOutput,
  HarnessFile,
  TryItConfig,
} from '../types';
import { registerAdapter } from '../registry';

// ============================================================================
// LangGraph Adapter Implementation
// ============================================================================

export const langgraphAdapter: HarnessAdapter = {
  id: 'langgraph',
  name: 'LangGraph',
  description: 'Generate Python graph definitions for LangGraph',
  icon: 'GitBranch',
  url: 'https://langchain-ai.github.io/langgraph/',

  canExport(story: AgentStory): HarnessCompatibility {
    const warnings: string[] = [];
    const missingFeatures: string[] = [];
    const unsupportedFeatures: string[] = [];

    // Basic validation
    if (!story.name) {
      missingFeatures.push('agent name');
    }

    if (!story.skills?.length) {
      warnings.push('Agent has no skills - graph will have minimal nodes');
    }

    // LangGraph excels at workflows
    const hasWorkflows = story.skills?.some(
      (skill) => skill.behavior?.model === 'workflow'
    );
    if (!hasWorkflows) {
      warnings.push('No workflow behaviors found - consider using workflow model for better graph structure');
    }

    // Check for features that need special handling
    if (story.memory?.persistent?.length) {
      warnings.push('Persistent stores will be mapped to graph state checkpointing');
    }

    const compatible = missingFeatures.length === 0;

    return {
      compatible,
      warnings,
      missingFeatures,
      unsupportedFeatures,
    };
  },

  generate(story: AgentStory): HarnessOutput {
    const files: HarnessFile[] = [];
    const warnings: string[] = [];

    // Generate main agent.py
    const agentPy = generateAgentPython(story);
    files.push({
      path: 'langgraph/agent.py',
      content: agentPy,
    });

    // Generate state.py
    const statePy = generateStatePython(story);
    files.push({
      path: 'langgraph/state.py',
      content: statePy,
    });

    // Generate tools.py if tools exist
    const toolsPy = generateToolsPython(story);
    if (toolsPy) {
      files.push({
        path: 'langgraph/tools.py',
        content: toolsPy,
      });
    }

    // Generate requirements.txt
    files.push({
      path: 'langgraph/requirements.txt',
      content: generateRequirements(),
    });

    const instructions = `
## Using with LangGraph

1. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

2. Set your API key:
   \`\`\`bash
   export OPENAI_API_KEY=your-key
   # or for Anthropic
   export ANTHROPIC_API_KEY=your-key
   \`\`\`

3. Run the agent:
   \`\`\`python
   from agent import create_graph

   graph = create_graph()
   result = graph.invoke({"messages": [("user", "Hello!")]})
   \`\`\`

4. For streaming:
   \`\`\`python
   for event in graph.stream({"messages": [("user", "Hello!")]}):
       print(event)
   \`\`\`
`.trim();

    return { files, warnings, instructions };
  },

  getTryItConfig(story: AgentStory): TryItConfig | null {
    return {
      type: 'cli',
      command: `python -m langgraph.agent`,
      setupInstructions: `
1. Install LangGraph: pip install langgraph langchain-anthropic
2. Set ANTHROPIC_API_KEY environment variable
3. Run the command to start the agent
      `.trim(),
      description: 'Run LangGraph agent locally',
    };
  },
};

// ============================================================================
// State Generation
// ============================================================================

function generateStatePython(story: AgentStory): string {
  const lines: string[] = [
    '"""',
    `State definitions for ${story.name} LangGraph agent.`,
    '"""',
    '',
    'from typing import Annotated, TypedDict, Sequence',
    'from langgraph.graph.message import add_messages',
    '',
    '',
    'class AgentState(TypedDict):',
    '    """State passed between nodes in the graph."""',
    '    ',
    '    # Message history',
    '    messages: Annotated[Sequence, add_messages]',
    '    ',
    '    # Current skill being executed',
    '    current_skill: str | None',
    '    ',
    '    # Workflow stage (for workflow behaviors)',
    '    stage: str | None',
    '    ',
    '    # Iteration counter (for iterative behaviors)',
    '    iteration: int',
    '    ',
  ];

  // Add custom state from memory stores
  if (story.memory?.persistent) {
    for (const store of story.memory.persistent) {
      const fieldName = generateSlug(store.name).replace(/-/g, '_');
      lines.push(`    # ${store.purpose}`);
      lines.push(`    ${fieldName}: dict | None`);
      lines.push('    ');
    }
  }

  // Add state fields for skill outputs
  if (story.skills) {
    for (const skill of story.skills) {
      if (skill.outputs?.length) {
        const fieldName = generateSlug(skill.name).replace(/-/g, '_') + '_output';
        lines.push(`    # Output from ${skill.name}`);
        lines.push(`    ${fieldName}: dict | None`);
        lines.push('    ');
      }
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Agent Graph Generation
// ============================================================================

function generateAgentPython(story: AgentStory): string {
  const agentSlug = generateSlug(story.name).replace(/-/g, '_');
  const lines: string[] = [
    '"""',
    `LangGraph agent: ${story.name}`,
    '',
    story.purpose || '',
    '"""',
    '',
    'from typing import Literal',
    'from langchain_anthropic import ChatAnthropic',
    'from langchain_core.messages import HumanMessage, SystemMessage',
    'from langgraph.graph import StateGraph, END',
    'from langgraph.prebuilt import ToolNode',
    '',
    'from state import AgentState',
  ];

  // Import tools if they exist
  const hasTools = story.skills?.some((s) => s.tools?.length);
  if (hasTools) {
    lines.push('from tools import get_tools');
  }

  lines.push('');
  lines.push('');

  // System prompt
  lines.push('# System prompt for the agent');
  lines.push(`SYSTEM_PROMPT = """${generateSystemPrompt(story)}"""`);
  lines.push('');

  // Model setup
  lines.push('# Initialize the model');
  lines.push('model = ChatAnthropic(model="claude-sonnet-4-20250514", temperature=0)');
  lines.push('');

  // Bind tools if available
  if (hasTools) {
    lines.push('# Bind tools to the model');
    lines.push('tools = get_tools()');
    lines.push('model_with_tools = model.bind_tools(tools)');
    lines.push('');
  }

  // Generate node functions for each skill
  if (story.skills?.length) {
    for (const skill of story.skills) {
      lines.push(generateNodeFunction(skill));
      lines.push('');
    }
  }

  // Router function
  lines.push(generateRouterFunction(story));
  lines.push('');

  // Main agent node
  lines.push('def agent_node(state: AgentState) -> AgentState:');
  lines.push('    """Main agent node that processes messages."""');
  lines.push('    messages = [SystemMessage(content=SYSTEM_PROMPT)] + list(state["messages"])');
  if (hasTools) {
    lines.push('    response = model_with_tools.invoke(messages)');
  } else {
    lines.push('    response = model.invoke(messages)');
  }
  lines.push('    return {"messages": [response]}');
  lines.push('');
  lines.push('');

  // Graph creation function
  lines.push('def create_graph():');
  lines.push(`    """Create the ${story.name} agent graph."""`);
  lines.push('    graph = StateGraph(AgentState)');
  lines.push('    ');
  lines.push('    # Add nodes');
  lines.push('    graph.add_node("agent", agent_node)');

  if (hasTools) {
    lines.push('    graph.add_node("tools", ToolNode(tools))');
  }

  // Add skill nodes
  if (story.skills?.length) {
    for (const skill of story.skills) {
      const nodeName = generateSlug(skill.name).replace(/-/g, '_');
      lines.push(`    graph.add_node("${nodeName}", ${nodeName}_node)`);
    }
  }

  lines.push('    ');
  lines.push('    # Set entry point');
  lines.push('    graph.set_entry_point("agent")');
  lines.push('    ');
  lines.push('    # Add edges');
  lines.push('    graph.add_conditional_edges("agent", route_agent)');

  if (hasTools) {
    lines.push('    graph.add_edge("tools", "agent")');
  }

  // Add edges from skill nodes back to agent
  if (story.skills?.length) {
    for (const skill of story.skills) {
      const nodeName = generateSlug(skill.name).replace(/-/g, '_');
      lines.push(`    graph.add_edge("${nodeName}", "agent")`);
    }
  }

  lines.push('    ');
  lines.push('    return graph.compile()');
  lines.push('');
  lines.push('');

  // Main entry point
  lines.push('if __name__ == "__main__":');
  lines.push('    graph = create_graph()');
  lines.push('    ');
  lines.push('    # Interactive loop');
  lines.push(`    print(f"Chat with ${story.name}. Type 'quit' to exit.")`);
  lines.push('    state = {"messages": [], "current_skill": None, "stage": None, "iteration": 0}');
  lines.push('    ');
  lines.push('    while True:');
  lines.push('        user_input = input("You: ")');
  lines.push('        if user_input.lower() == "quit":');
  lines.push('            break');
  lines.push('        ');
  lines.push('        state["messages"].append(HumanMessage(content=user_input))');
  lines.push('        result = graph.invoke(state)');
  lines.push('        state = result');
  lines.push('        ');
  lines.push("        print(f\"Agent: {result['messages'][-1].content}\")");

  return lines.join('\n');
}

// ============================================================================
// Node Function Generation
// ============================================================================

function generateNodeFunction(skill: Skill): string {
  const nodeName = generateSlug(skill.name).replace(/-/g, '_');
  const lines: string[] = [
    `def ${nodeName}_node(state: AgentState) -> AgentState:`,
    `    """`,
    `    ${skill.name}: ${skill.description}`,
  ];

  // Add trigger info
  if (skill.triggers?.length) {
    lines.push('    ');
    lines.push('    Triggers:');
    for (const t of skill.triggers) {
      lines.push(`    - ${t.type}: ${t.description}`);
    }
  }

  lines.push('    """');

  // Implementation based on behavior model
  if (skill.behavior) {
    switch (skill.behavior.model) {
      case 'sequential':
        lines.push('    # Sequential execution');
        lines.push('    steps = [');
        for (const step of skill.behavior.steps) {
          lines.push(`        "${step}",`);
        }
        lines.push('    ]');
        lines.push('    ');
        lines.push('    # TODO: Execute each step');
        lines.push('    for step in steps:');
        lines.push('        pass  # Implement step execution');
        break;

      case 'workflow':
        lines.push('    # Workflow execution');
        lines.push(`    current_stage = state.get("stage") or "${skill.behavior.stages[0]?.name || 'start'}"`);
        lines.push('    ');
        lines.push('    stages = {');
        for (const stage of skill.behavior.stages) {
          const stageName = generateSlug(stage.name).replace(/-/g, '_');
          lines.push(`        "${stageName}": {`);
          lines.push(`            "purpose": "${stage.purpose}",`);
          if (stage.transitions?.length) {
            lines.push('            "transitions": [');
            for (const t of stage.transitions) {
              lines.push(`                {"to": "${generateSlug(t.to).replace(/-/g, '_')}", "when": "${t.when}"},`);
            }
            lines.push('            ],');
          }
          lines.push('        },');
        }
        lines.push('    }');
        lines.push('    ');
        lines.push('    # TODO: Execute current stage and determine next');
        break;

      case 'adaptive':
        lines.push('    # Adaptive execution');
        lines.push('    capabilities = [');
        for (const cap of skill.behavior.capabilities) {
          lines.push(`        "${cap}",`);
        }
        lines.push('    ]');
        lines.push('    ');
        lines.push('    # TODO: Select and execute based on context');
        break;

      case 'iterative':
        lines.push('    # Iterative execution');
        lines.push(`    max_iterations = ${skill.behavior.maxIterations || 10}`);
        lines.push(`    termination = "${skill.behavior.terminationCondition}"`);
        lines.push('    ');
        lines.push('    iteration = state.get("iteration", 0)');
        lines.push('    ');
        lines.push('    # TODO: Execute iteration body');
        lines.push('    body = [');
        for (const b of skill.behavior.body) {
          lines.push(`        "${b}",`);
        }
        lines.push('    ]');
        lines.push('    ');
        lines.push('    # Check termination');
        lines.push('    if iteration >= max_iterations:');
        lines.push('        return {"iteration": 0}');
        lines.push('    ');
        lines.push('    return {"iteration": iteration + 1}');
        break;
    }
  } else {
    lines.push('    # TODO: Implement skill logic');
    lines.push('    pass');
  }

  lines.push('    ');
  lines.push('    return state');

  return lines.join('\n');
}

// ============================================================================
// Router Function Generation
// ============================================================================

function generateRouterFunction(story: AgentStory): string {
  const lines: string[] = [
    'def route_agent(state: AgentState) -> Literal["tools", "end"' +
      (story.skills?.length
        ? ', ' + story.skills.map((s) => `"${generateSlug(s.name).replace(/-/g, '_')}"`).join(', ')
        : '') +
      ']:',
    '    """Route agent output to appropriate node."""',
    '    last_message = state["messages"][-1]',
    '    ',
  ];

  // Check for tool calls
  lines.push('    # Check for tool calls');
  lines.push('    if hasattr(last_message, "tool_calls") and last_message.tool_calls:');
  lines.push('        return "tools"');
  lines.push('    ');

  // Check for skill triggers (simplified - in reality would analyze message content)
  if (story.skills?.length) {
    lines.push('    # Route to specific skills based on intent');
    lines.push('    content = last_message.content.lower() if hasattr(last_message, "content") else ""');
    lines.push('    ');

    for (const skill of story.skills) {
      const nodeName = generateSlug(skill.name).replace(/-/g, '_');
      // Use skill name keywords as simple routing
      const keywords = skill.name.toLowerCase().split(/\s+/);
      lines.push(`    # ${skill.name}`);
      lines.push(`    if any(kw in content for kw in ${JSON.stringify(keywords)}):`);
      lines.push(`        return "${nodeName}"`);
      lines.push('    ');
    }
  }

  lines.push('    return "end"');

  return lines.join('\n');
}

// ============================================================================
// Tools Generation
// ============================================================================

function generateToolsPython(story: AgentStory): string | null {
  const allTools = story.skills?.flatMap((s) => s.tools || []) || [];
  if (!allTools.length) return null;

  const seenTools = new Set<string>();
  const lines: string[] = [
    '"""',
    `Tool definitions for ${story.name} LangGraph agent.`,
    '"""',
    '',
    'from langchain_core.tools import tool',
    '',
    '',
  ];

  for (const t of allTools) {
    const toolName = generateSlug(t.name).replace(/-/g, '_');
    if (seenTools.has(toolName)) continue;
    seenTools.add(toolName);

    lines.push('@tool');
    lines.push(`def ${toolName}() -> str:`);
    lines.push(`    """${t.purpose}"""`);
    lines.push(`    # TODO: Implement ${t.name}`);
    lines.push(`    return "Tool executed"`);
    lines.push('');
  }

  lines.push('');
  lines.push('def get_tools():');
  lines.push('    """Return all available tools."""');
  lines.push('    return [');
  for (const t of allTools) {
    const toolName = generateSlug(t.name).replace(/-/g, '_');
    if (!seenTools.has(toolName + '_added')) {
      lines.push(`        ${toolName},`);
      seenTools.add(toolName + '_added');
    }
  }
  lines.push('    ]');

  return lines.join('\n');
}

// ============================================================================
// System Prompt Generation
// ============================================================================

function generateSystemPrompt(story: AgentStory): string {
  const parts: string[] = [];

  parts.push(`You are ${story.name}.`);

  if (story.role) {
    parts.push(story.role);
  }

  if (story.purpose) {
    parts.push(`Your purpose: ${story.purpose}`);
  }

  if (story.skills?.length) {
    parts.push('\nYou have the following capabilities:');
    for (const skill of story.skills) {
      parts.push(`- ${skill.name}: ${skill.description}`);
    }
  }

  if (story.guardrails?.length) {
    parts.push('\nConstraints you must follow:');
    for (const g of story.guardrails) {
      parts.push(`- ${g.name}: ${g.constraint}`);
    }
  }

  return parts.join('\n');
}

// ============================================================================
// Requirements Generation
// ============================================================================

function generateRequirements(): string {
  return `langgraph>=0.2.0
langchain-anthropic>=0.2.0
langchain-core>=0.3.0
`;
}

// ============================================================================
// Register Adapter
// ============================================================================

registerAdapter(langgraphAdapter);
