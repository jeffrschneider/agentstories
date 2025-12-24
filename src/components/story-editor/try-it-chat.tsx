'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Loader2, RotateCcw, Bot, User, Terminal, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { AgentStory } from '@/lib/schemas/story';

// Message types for the chat
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  timestamp: Date;
  toolName?: string;
  toolInput?: unknown;
  isError?: boolean;
}

interface TryItChatProps {
  story: AgentStory;
}

export function TryItChat({ story }: TryItChatProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [streamingContent, setStreamingContent] = React.useState('');
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages((prev) => [
      ...prev,
      {
        ...message,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // Add user message
    addMessage({ role: 'user', content: trimmedInput });
    setInput('');
    setStreamingContent('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story,
          message: trimmedInput,
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run agent');
      }

      // Handle NDJSON streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const data = JSON.parse(line);

            switch (data.type) {
              case 'text':
                accumulatedContent += data.content || '';
                setStreamingContent(accumulatedContent);
                break;

              case 'tool_use':
                // Add tool use indicator
                addMessage({
                  role: 'tool',
                  content: `Using tool: ${data.toolName}`,
                  toolName: data.toolName,
                  toolInput: data.toolInput,
                });
                break;

              case 'tool_result':
                // Tool result comes back - continue accumulating text
                break;

              case 'status':
                // Status updates (init, processing, etc.)
                if (data.sessionId && !sessionId) {
                  setSessionId(data.sessionId);
                }
                break;

              case 'result':
                // Final result
                if (data.sessionId && !sessionId) {
                  setSessionId(data.sessionId);
                }
                if (data.isError) {
                  setError(data.content || 'An error occurred');
                }
                break;

              case 'error':
                setError(data.error || 'An error occurred');
                break;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      // Add the complete assistant message
      if (accumulatedContent) {
        addMessage({ role: 'assistant', content: accumulatedContent });
        setStreamingContent('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStreamingContent('');
    } finally {
      setIsLoading(false);
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
    setSessionId(null);
    setError(null);
    setStreamingContent('');
    textareaRef.current?.focus();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-medium">Testing: {story.name}</span>
        </div>
        {sessionId && (
          <Badge variant="outline" className="text-xs">
            Session active
          </Badge>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 bg-muted/30">
        <div className="mx-auto w-full max-w-3xl px-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Try Your Agent</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                Test <strong>{story.name}</strong> with a real conversation.
                The agent will respond using its defined skills and behaviors.
              </p>
              <div className="mt-6 rounded-lg border bg-background p-4 text-left text-sm">
                <p className="font-medium mb-2">Agent Configuration:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Autonomy: <span className="text-foreground capitalize">{story.autonomyLevel || 'Not set'}</span></li>
                  <li>Skills: <span className="text-foreground">{story.skills?.length || 0} defined</span></li>
                  <li>Guardrails: <span className="text-foreground">{story.guardrails?.length || 0} constraints</span></li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {streamingContent && (
                <MessageBubble
                  message={{
                    id: 'streaming',
                    role: 'assistant',
                    content: streamingContent,
                    timestamp: new Date(),
                  }}
                  isStreaming
                />
              )}
              {isLoading && !streamingContent && (
                <div className="flex items-center gap-2 rounded-lg bg-background/50 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Agent is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Error Display */}
      {error && (
        <div className="mx-auto w-full max-w-3xl px-4 pb-2">
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <XCircle className="h-4 w-4" />
            {error}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="mx-auto w-full max-w-3xl">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Send a message to test your agent..."
                className="min-h-[60px] resize-none"
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                size="icon"
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
                  onClick={handleClearChat}
                  title="Clear chat"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isTool = message.role === 'tool';

  if (isTool) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Terminal className="h-4 w-4" />
        <span>{message.content}</span>
        {message.toolName && (
          <Badge variant="secondary" className="text-xs">
            {message.toolName}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {isUser ? (
        <div className="flex justify-end gap-2">
          <div className="max-w-[85%] rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex-1 rounded-lg border bg-background px-4 py-3 shadow-sm">
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              {isStreaming && (
                <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-primary" />
              )}
            </div>
            {message.isError && (
              <div className="mt-2 flex items-center gap-1 text-xs text-destructive">
                <XCircle className="h-3 w-3" />
                Error occurred
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
