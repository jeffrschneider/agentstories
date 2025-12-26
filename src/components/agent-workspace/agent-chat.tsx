'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Loader2, RotateCcw, Sparkles, FileText, Bot, ChevronDown, Maximize2, Minimize2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ContentBlock, BatchActions, ReviewAllDialog, parseContentBlocks, type CodeBlock } from './content-block';
import type { AgentFile } from '@/lib/agent-files';
import {
  buildStructuredSystemPrompt,
  parseAgentChatResponse,
  generateAgentMd,
  generateSkillMd,
  generateAgentConfig,
  generateSkillConfig,
  generateSlug,
  type AgentChatResponse,
} from '@/lib/agent-files';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatAction {
  type: 'create_file' | 'update_file' | 'delete_file' | 'update_name';
  path: string;
  content?: string;
  name?: string;
}

interface CurrentAgentState {
  name?: string;
  purpose?: string;
  role?: string;
  autonomyLevel?: string;
  skills?: { name: string; description?: string }[];
}

interface AgentChatProps {
  files: AgentFile[];
  activeFile: AgentFile | null;
  agentName: string;
  currentAgent?: CurrentAgentState;
  onAction: (action: ChatAction) => void;
  onCreateNewAgent?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

// Intent detection patterns for creating a new agent
const NEW_AGENT_PATTERNS = [
  /\b(create|make|start|build)\s+(a\s+)?(new|fresh|another|different)\s+agent\b/i,
  /\bnew\s+agent\b/i,
  /\bstart\s+(over|fresh)\b/i,
  /\bfrom\s+scratch\b/i,
  /\bdifferent\s+agent\b/i,
  /\banother\s+agent\b/i,
];

function detectNewAgentIntent(input: string): boolean {
  return NEW_AGENT_PATTERNS.some(pattern => pattern.test(input));
}

export function AgentChat({
  files,
  activeFile,
  agentName,
  currentAgent,
  onAction,
  onCreateNewAgent,
  isExpanded = false,
  onToggleExpand,
  className,
}: AgentChatProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [streamingContent, setStreamingContent] = React.useState('');
  const [scope, setScope] = React.useState<'file' | 'agent'>('file');
  const [appliedBlocks, setAppliedBlocks] = React.useState<Set<string>>(new Set());
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Reset scope when file changes
  React.useEffect(() => {
    setScope(activeFile ? 'file' : 'agent');
  }, [activeFile?.path]);

  const effectiveScope = activeFile && scope === 'file' ? 'file' : 'agent';
  const contextFile = effectiveScope === 'file' ? activeFile : null;

  const buildSystemPrompt = () => {
    const fileList = files.map(f => `- ${f.path}`).join('\n');

    if (contextFile) {
      // File-specific editing - keep the simple markdown format
      return `You are helping edit the file "${contextFile.path}" for the agent "${agentName}".

Current file content:
\`\`\`
${contextFile.content}
\`\`\`

Help the user modify this file. When suggesting changes:
1. Acknowledge what they want to change
2. Provide the updated content in a fenced code block
3. Use markdown or yaml language tags as appropriate
4. Be concise but include complete sections

IMPORTANT: When providing file updates, always wrap them in fenced code blocks so users can apply them.`;
    }

    // Agent scope - pass file contents for context
    const fileContents = files
      .filter(f => !f.path.includes('.gitkeep'))
      .map(f => ({ path: f.path, content: f.content }));

    return buildStructuredSystemPrompt(agentName, fileList, currentAgent, fileContents);
  };

  // Convert a JSON response to file actions
  const processStructuredResponse = React.useCallback((response: AgentChatResponse): ChatAction[] => {
    const actions: ChatAction[] = [];

    // Handle question action - no file changes, just display the message
    if (response.action === 'question') {
      return actions; // Empty - the message is already shown in the chat
    }

    // Process agent identity
    if (response.agent) {
      // Build skill links for agent.md
      const skillLinks = response.skills?.map(s => {
        const slug = generateSlug(s.name);
        return `- [${s.name}](skills/${slug}/SKILL.md) - ${s.description || 'No description'}`;
      }) || [];

      // Also include existing skills that aren't being updated
      const existingSkillFiles = files.filter(f => f.path.endsWith('SKILL.md'));
      for (const skillFile of existingSkillFiles) {
        const pathMatch = skillFile.path.match(/skills\/([^/]+)\/SKILL\.md/);
        if (pathMatch) {
          const slug = pathMatch[1];
          // Don't duplicate if this skill is being updated
          const isBeingUpdated = response.skills?.some(s => generateSlug(s.name) === slug);
          if (!isBeingUpdated) {
            // Extract name from file content (look for # Title)
            const titleMatch = skillFile.content.match(/^#\s+(.+)$/m);
            const name = titleMatch?.[1] || slug;
            const descMatch = skillFile.content.match(/description:\s*(.+)/);
            const desc = descMatch?.[1] || 'No description';
            skillLinks.push(`- [${name}](skills/${slug}/SKILL.md) - ${desc}`);
          }
        }
      }

      const skillsSection = skillLinks.length > 0
        ? `\n## Skills\n${skillLinks.join('\n')}\n`
        : '';

      const agentStory = {
        name: response.agent.name || agentName,
        purpose: response.agent.purpose,
        role: response.agent.role,
        autonomyLevel: response.agent.autonomyLevel,
        guardrails: response.agent.guardrails?.map(g => ({
          ...g,
          enforcement: 'hard' as const,
        })),
        tags: response.agent.tags,
      } as import('@/lib/schemas/story').AgentStory;

      // Generate agent.md with skills section appended
      const agentContent = generateAgentMd(agentStory) + skillsSection;

      actions.push({
        type: files.some(f => f.path === 'agent.md') ? 'update_file' : 'create_file',
        path: 'agent.md',
        content: agentContent,
      });

      // Generate config.yaml for the agent
      const isNewAgent = !files.some(f => f.path === 'config.yaml');
      actions.push({
        type: isNewAgent ? 'create_file' : 'update_file',
        path: 'config.yaml',
        content: generateAgentConfig(agentStory),
      });

      // Create directory structure for new agents
      if (isNewAgent) {
        // Create memory directories
        actions.push({
          type: 'create_file',
          path: 'memory/short_term/.gitkeep',
          content: '',
        });
        actions.push({
          type: 'create_file',
          path: 'memory/long_term/.gitkeep',
          content: '',
        });
        // Create tools directory
        actions.push({
          type: 'create_file',
          path: 'tools/.gitkeep',
          content: '',
        });
        // Create logs directory
        actions.push({
          type: 'create_file',
          path: 'logs/.gitkeep',
          content: '',
        });
      }

      // Update the agent name in the UI header
      if (response.agent.name) {
        actions.push({
          type: 'update_name',
          path: '',
          name: response.agent.name,
        });
      }
    }

    // Process skills
    if (response.skills?.length) {
      for (const skill of response.skills) {
        const slug = generateSlug(skill.name);
        const skillPath = `skills/${slug}/SKILL.md`;

        const skillContent = generateSkillMd({
          id: crypto.randomUUID(),
          name: skill.name,
          description: skill.description || '',
          domain: skill.domain || 'General',
          acquired: 'built_in',
          portability: {
            slug,
            license: skill.license,
            compatibility: skill.compatibility,
            scripts: skill.scripts?.map(s => ({
              filename: s.filename,
              language: s.language as 'python' | 'bash' | 'javascript' | 'typescript',
              purpose: s.purpose,
              content: s.content,
            })),
            references: skill.references?.map(r => ({
              filename: r.filename,
              title: r.title,
              content: r.content,
            })),
            assets: skill.assets?.map(a => ({
              filename: a.filename,
              type: (a.type || 'other') as 'json' | 'yaml' | 'csv' | 'txt' | 'png' | 'svg' | 'other',
              description: a.description,
              content: a.content,
            })),
          },
          triggers: skill.triggers?.map(t => ({
            type: t.type as 'message' | 'schedule' | 'manual' | 'condition',
            description: t.description,
          })) || [{ type: 'manual' as const, description: 'Manually triggered' }],
          behavior: skill.behavior?.model === 'sequential' && skill.behavior.steps ? {
            model: 'sequential' as const,
            steps: skill.behavior.steps,
          } : skill.behavior?.model === 'workflow' ? {
            model: 'workflow' as const,
            stages: [],
          } : skill.behavior?.model === 'adaptive' ? {
            model: 'adaptive' as const,
            capabilities: [],
          } : undefined,
          tools: skill.tools?.map(t => ({
            name: t.name,
            purpose: t.purpose,
            permissions: t.permissions as ('read' | 'write' | 'execute')[],
            required: true,
          })),
          acceptance: skill.acceptance ? {
            successConditions: skill.acceptance.successConditions,
          } : { successConditions: ['Task completed successfully'] },
          guardrails: skill.guardrails?.map(g => ({
            ...g,
            enforcement: 'hard' as const,
          })),
        });

        actions.push({
          type: files.some(f => f.path === skillPath) ? 'update_file' : 'create_file',
          path: skillPath,
          content: skillContent,
        });

        // Create skill config.yaml
        const skillConfigPath = `skills/${slug}/config.yaml`;
        const skillObj = {
          id: crypto.randomUUID(),
          name: skill.name,
          description: skill.description || '',
          domain: skill.domain || 'General',
          acquired: 'built_in' as const,
          triggers: skill.triggers?.map(t => ({
            type: t.type as 'message' | 'schedule' | 'manual' | 'condition',
            description: t.description,
          })) || [{ type: 'manual' as const, description: 'Manually triggered' }],
          behavior: skill.behavior?.model === 'sequential' && skill.behavior.steps ? {
            model: 'sequential' as const,
            steps: skill.behavior.steps,
          } : { model: 'sequential' as const, steps: ['Execute task'] },
          tools: skill.tools?.map(t => ({
            name: t.name,
            purpose: t.purpose,
            permissions: t.permissions as ('read' | 'write' | 'execute')[],
            required: true,
          })),
          acceptance: skill.acceptance ? {
            successConditions: skill.acceptance.successConditions,
          } : { successConditions: ['Task completed successfully'] },
          guardrails: skill.guardrails?.map(g => ({
            ...g,
            enforcement: 'hard' as const,
          })),
        };
        actions.push({
          type: files.some(f => f.path === skillConfigPath) ? 'update_file' : 'create_file',
          path: skillConfigPath,
          content: generateSkillConfig(skillObj),
        });

        // Create skill subdirectories if they don't exist
        const isNewSkill = !files.some(f => f.path === skillPath);
        if (isNewSkill) {
          // scripts/ directory
          if (!skill.scripts?.length) {
            actions.push({
              type: 'create_file',
              path: `skills/${slug}/scripts/.gitkeep`,
              content: '',
            });
          }
          // references/ directory
          if (!skill.references?.length) {
            actions.push({
              type: 'create_file',
              path: `skills/${slug}/references/.gitkeep`,
              content: '',
            });
          }
          // assets/ directory
          if (!skill.assets?.length) {
            actions.push({
              type: 'create_file',
              path: `skills/${slug}/assets/.gitkeep`,
              content: '',
            });
          }
        }

        // Create script files
        if (skill.scripts?.length) {
          for (const script of skill.scripts) {
            const scriptPath = `skills/${slug}/scripts/${script.filename}`;
            actions.push({
              type: files.some(f => f.path === scriptPath) ? 'update_file' : 'create_file',
              path: scriptPath,
              content: script.content || '',
            });
          }
        }

        // Create reference files
        if (skill.references?.length) {
          for (const ref of skill.references) {
            const refPath = `skills/${slug}/references/${ref.filename}`;
            actions.push({
              type: files.some(f => f.path === refPath) ? 'update_file' : 'create_file',
              path: refPath,
              content: ref.content || '',
            });
          }
        }

        // Create asset files
        if (skill.assets?.length) {
          for (const asset of skill.assets) {
            const assetPath = `skills/${slug}/assets/${asset.filename}`;
            actions.push({
              type: files.some(f => f.path === assetPath) ? 'update_file' : 'create_file',
              path: assetPath,
              content: asset.content || '',
            });
          }
        }
      }
    }

    // Process arbitrary file actions
    if (response.files?.length) {
      for (const file of response.files) {
        if (file.action === 'delete') {
          actions.push({
            type: 'delete_file',
            path: file.path,
          });
        } else {
          actions.push({
            type: files.some(f => f.path === file.path) ? 'update_file' : 'create_file',
            path: file.path,
            content: file.content,
          });
        }
      }
    }

    return actions;
  }, [files, agentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // Check for "new agent" intent
    if (onCreateNewAgent && detectNewAgentIntent(trimmedInput)) {
      setInput('');
      onCreateNewAgent();
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setStreamingContent('');
    setIsLoading(true);
    setError(null);

    try {
      const systemPrompt = buildSystemPrompt();

      const chatMessages = [
        { role: 'user' as const, content: systemPrompt },
        { role: 'assistant' as const, content: 'I understand. How can I help you?' },
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: trimmedInput },
      ];

      const response = await fetch('/api/ideation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'delta' && data.text) {
                accumulatedContent += data.text;
                setStreamingContent(accumulatedContent);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      if (accumulatedContent) {
        // Try to parse as structured JSON response (for agent scope)
        const structuredResponse = effectiveScope === 'agent'
          ? parseAgentChatResponse(accumulatedContent)
          : null;

        if (structuredResponse) {
          // Apply the structured changes automatically
          const actions = processStructuredResponse(structuredResponse);
          for (const action of actions) {
            onAction(action);
          }

          // Create a user-friendly message showing what was done
          const appliedFiles = actions.map(a => a.path).join(', ');
          const displayMessage = `${structuredResponse.message}\n\n✓ Applied changes to: ${appliedFiles}`;

          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: displayMessage,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          // Fallback to regular markdown/code block handling
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: accumulatedContent,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
        setStreamingContent('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStreamingContent('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyContent = (content: string, targetFile: string, blockId?: string) => {
    const existingFile = files.find((f) => f.path === targetFile);

    if (existingFile) {
      onAction({
        type: 'update_file',
        path: targetFile,
        content,
      });
    } else {
      onAction({
        type: 'create_file',
        path: targetFile,
        content,
      });
    }

    // Track applied block
    if (blockId) {
      setAppliedBlocks((prev) => new Set([...prev, blockId]));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    setAppliedBlocks(new Set());
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Context header */}
      <div className="border-b px-3 py-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {effectiveScope === 'file' && contextFile ? (
              <>
                <FileText className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {contextFile.path.split('/').pop()}
                </span>
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium truncate max-w-[120px]">{agentName}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                  {effectiveScope === 'file' ? 'File' : 'Agent'}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setScope('agent')}
                  disabled={!activeFile}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Agent scope
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setScope('file')}
                  disabled={!activeFile}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  File scope
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {onToggleExpand && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onToggleExpand}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 bg-muted/30">
        <div className="px-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="h-8 w-8 text-primary mb-3" />
              <p className="text-sm text-muted-foreground max-w-[200px]">
                {effectiveScope === 'file' && contextFile
                  ? `Editing ${contextFile.path.split('/').pop()}`
                  : 'Ask me to create skills, update the agent, or make changes'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 py-3">
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  files={files}
                  activeFile={activeFile}
                  onApplyContent={handleApplyContent}
                  appliedBlocks={appliedBlocks}
                />
              ))}
              {streamingContent && (
                <ChatBubble
                  message={{
                    id: 'streaming',
                    role: 'assistant',
                    content: streamingContent,
                    timestamp: new Date(),
                  }}
                  files={files}
                  activeFile={activeFile}
                  onApplyContent={handleApplyContent}
                  appliedBlocks={appliedBlocks}
                  isStreaming
                />
              )}
              {isLoading && !streamingContent && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 shrink-0">
          <div className="rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">
            {error}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-3 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe changes..."
            className="min-h-[60px] resize-none text-sm"
            disabled={isLoading}
          />
          <div className="flex flex-col gap-1">
            <Button
              type="submit"
              size="icon"
              className="h-8 w-8"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            {messages.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleClearChat}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  files,
  activeFile,
  onApplyContent,
  appliedBlocks,
  isStreaming,
}: {
  message: ChatMessage;
  files: AgentFile[];
  activeFile: AgentFile | null;
  onApplyContent: (content: string, targetFile: string, blockId?: string) => void;
  appliedBlocks: Set<string>;
  isStreaming?: boolean;
}) {
  const isUser = message.role === 'user';
  const [showReviewAll, setShowReviewAll] = React.useState(false);

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[90%] rounded-lg px-3 py-2 text-sm bg-primary text-primary-foreground">
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    );
  }

  // Parse content into blocks for assistant messages
  const contentBlocks = parseContentBlocks(message.content, activeFile?.path);
  const availableFiles = files.map((f) => f.path);

  // Extract code blocks with IDs for batch operations
  const codeBlocks: CodeBlock[] = contentBlocks
    .filter((b) => b.type === 'code')
    .map((block, i) => {
      const targetFile = block.targetFile || activeFile?.path || 'agent.md';
      const currentFile = files.find((f) => f.path === targetFile);
      return {
        id: `${message.id}-block-${i}`,
        content: block.content,
        language: block.language,
        targetFile,
        currentContent: currentFile?.content,
      };
    });

  const appliedCount = codeBlocks.filter((b) => appliedBlocks.has(b.id)).length;

  const handleApplyAll = () => {
    codeBlocks.forEach((block) => {
      if (!appliedBlocks.has(block.id)) {
        onApplyContent(block.content, block.targetFile, block.id);
      }
    });
  };

  const handleApplySingle = (blockId: string) => {
    const block = codeBlocks.find((b) => b.id === blockId);
    if (block) {
      onApplyContent(block.content, block.targetFile, block.id);
    }
  };

  return (
    <div className="flex justify-start">
      <div className="max-w-[95%] space-y-2">
        {contentBlocks.map((block, i) => {
          if (block.type === 'code') {
            const targetFile = block.targetFile || activeFile?.path || 'agent.md';
            const currentFile = files.find((f) => f.path === targetFile);
            const blockId = `${message.id}-block-${codeBlocks.findIndex(
              (cb) => cb.content === block.content && cb.targetFile === targetFile
            )}`;

            return (
              <ContentBlock
                key={i}
                content={block.content}
                language={block.language}
                targetFile={targetFile}
                currentContent={currentFile?.content}
                onApply={(content, file) => onApplyContent(content, file, blockId)}
                availableFiles={availableFiles}
                isApplied={appliedBlocks.has(blockId)}
              />
            );
          }

          // Render text blocks as markdown
          return (
            <div
              key={i}
              className="rounded-lg px-3 py-2 text-sm bg-background border shadow-sm"
            >
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-pre:my-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {block.content}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}

        {/* Batch actions for multiple code blocks */}
        {!isStreaming && codeBlocks.length > 1 && (
          <BatchActions
            blocks={codeBlocks}
            onApplyAll={handleApplyAll}
            onReviewAll={() => setShowReviewAll(true)}
            appliedCount={appliedCount}
          />
        )}

        {isStreaming && (
          <span className="inline-block h-4 w-1 animate-pulse bg-primary ml-0.5" />
        )}

        {/* Review All Dialog */}
        <ReviewAllDialog
          open={showReviewAll}
          onOpenChange={setShowReviewAll}
          blocks={codeBlocks}
          appliedBlocks={appliedBlocks}
          onApply={handleApplySingle}
          onApplyAll={handleApplyAll}
        />
      </div>
    </div>
  );
}
