/**
 * API route for running an AgentStory using the Claude Agent SDK.
 *
 * This endpoint accepts a story and user message, then streams
 * agent responses back to the client.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { storyToSystemPrompt, extractToolsFromStory } from '@/lib/agent/story-to-prompt';
import { AgentStorySchema } from '@/lib/schemas/story';

export const runtime = 'nodejs';

/**
 * POST /api/agent/run
 *
 * Body: {
 *   story: AgentStory,
 *   message: string,
 *   sessionId?: string  // For continuing conversations
 * }
 *
 * Returns: Streaming response with agent messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { story: storyData, message, sessionId } = body;

    // Validate the story
    const parseResult = AgentStorySchema.safeParse(storyData);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid story data', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const story = parseResult.data;

    // Convert story to system prompt
    const systemPrompt = storyToSystemPrompt(story);

    // Extract tools from story
    const tools = extractToolsFromStory(story);

    // Create abort controller for cancellation
    const abortController = new AbortController();

    // Map autonomy level to permission mode
    const permissionMode = mapAutonomyToPermissions(story.autonomyLevel);

    // Create the query
    const agentQuery = query({
      prompt: message,
      options: {
        systemPrompt,
        tools,
        permissionMode,
        abortController,
        resume: sessionId,
        // Include partial messages for streaming
        includePartialMessages: true,
        // Prevent prompting for permissions in the API context
        allowedTools: tools,
        // Don't persist sessions for Try It feature
        persistSession: false,
      },
    });

    // Create a readable stream to send responses
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const message of agentQuery) {
            // Format message for client consumption
            const formattedMessage = formatMessageForClient(message);
            if (formattedMessage) {
              const data = JSON.stringify(formattedMessage) + '\n';
              controller.enqueue(encoder.encode(data));
            }
          }
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: 'error', error: errorMessage }) + '\n')
          );
          controller.close();
        }
      },
      cancel() {
        abortController.abort();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Agent run error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Map autonomy level to SDK permission mode
 */
function mapAutonomyToPermissions(
  autonomyLevel?: string
): 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'dontAsk' {
  switch (autonomyLevel) {
    case 'full':
      // Full autonomy - accept edits automatically
      return 'acceptEdits';
    case 'supervised':
    case 'collaborative':
      // Default mode with permission prompts
      return 'default';
    case 'directed':
      // More restrictive - don't ask, deny if not pre-approved
      return 'dontAsk';
    default:
      return 'default';
  }
}

// Type for SDK messages (simplified for client)
interface ClientMessage {
  type: 'text' | 'tool_use' | 'tool_result' | 'error' | 'result' | 'status';
  content?: string;
  toolName?: string;
  toolInput?: unknown;
  toolResult?: unknown;
  sessionId?: string;
  isError?: boolean;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    costUSD: number;
  };
}

/**
 * Format SDK messages for client consumption
 */
function formatMessageForClient(message: unknown): ClientMessage | null {
  const msg = message as Record<string, unknown>;

  switch (msg.type) {
    case 'assistant': {
      // Full assistant message
      const assistantMsg = msg.message as Record<string, unknown>;
      const content = assistantMsg.content as Array<Record<string, unknown>>;

      // Find text blocks
      const textBlocks = content?.filter((block) => block.type === 'text');
      if (textBlocks?.length) {
        return {
          type: 'text',
          content: textBlocks.map((block) => block.text).join('\n'),
          sessionId: msg.session_id as string,
        };
      }

      // Find tool use blocks
      const toolBlocks = content?.filter((block) => block.type === 'tool_use');
      if (toolBlocks?.length) {
        const tool = toolBlocks[0];
        return {
          type: 'tool_use',
          toolName: tool.name as string,
          toolInput: tool.input,
          sessionId: msg.session_id as string,
        };
      }
      return null;
    }

    case 'user': {
      // Tool results come back as user messages
      if (msg.tool_use_result) {
        return {
          type: 'tool_result',
          toolResult: msg.tool_use_result,
          sessionId: msg.session_id as string,
        };
      }
      return null;
    }

    case 'stream_event': {
      // Partial streaming message
      const event = msg.event as Record<string, unknown>;
      if (event.type === 'content_block_delta') {
        const delta = event.delta as Record<string, unknown>;
        if (delta.type === 'text_delta') {
          return {
            type: 'text',
            content: delta.text as string,
            sessionId: msg.session_id as string,
          };
        }
      }
      return null;
    }

    case 'result': {
      // Final result message
      const subtype = msg.subtype as string;
      const isError = subtype !== 'success';

      return {
        type: 'result',
        isError,
        content: isError
          ? ((msg.errors as string[]) || []).join('\n')
          : (msg.result as string),
        usage: {
          inputTokens: (msg.usage as Record<string, number>)?.input_tokens || 0,
          outputTokens: (msg.usage as Record<string, number>)?.output_tokens || 0,
          costUSD: (msg.total_cost_usd as number) || 0,
        },
        sessionId: msg.session_id as string,
      };
    }

    case 'system': {
      // System messages (init, status, etc.)
      if (msg.subtype === 'init') {
        return {
          type: 'status',
          content: 'Agent initialized',
          sessionId: msg.session_id as string,
        };
      }
      if (msg.subtype === 'status') {
        return {
          type: 'status',
          content: msg.status as string || 'Processing...',
          sessionId: msg.session_id as string,
        };
      }
      return null;
    }

    default:
      return null;
  }
}
