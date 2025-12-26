'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Loader2, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { AgentStory } from '@/lib/schemas/story';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface StoryChatInterfaceProps {
  story: AgentStory;
  onStoryUpdate: (updates: Partial<AgentStory>) => void;
}

export function StoryChatInterface({ story, onStoryUpdate }: StoryChatInterfaceProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [streamingContent, setStreamingContent] = React.useState('');
  const [lastUpdate, setLastUpdate] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const extractAndUpdate = React.useCallback(async (allMessages: ChatMessage[]) => {
    if (allMessages.length < 2) return;

    try {
      const messagesForExtraction = allMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/story/update-from-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesForExtraction,
          currentStory: story,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.updates && Object.keys(data.updates).length > 0) {
          onStoryUpdate(data.updates);
          // Show what was updated
          const updatedFields = Object.keys(data.updates).join(', ');
          setLastUpdate(updatedFields);
          setTimeout(() => setLastUpdate(null), 3000);
        }
      }
    } catch (err) {
      console.error('Extraction error:', err);
    }
  }, [story, onStoryUpdate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // Add user message
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
      // Build system context with current story
      const systemContext = `You are helping the user edit their AI agent specification. Here is the current agent:

Name: ${story.name || '(not set)'}
Purpose: ${story.purpose || '(not set)'}
Role: ${story.role || '(not set)'}
Autonomy Level: ${story.autonomyLevel || '(not set)'}
Skills: ${story.skills?.map(s => s.name).join(', ') || '(none)'}

When the user describes changes, acknowledge them and explain how the agent will be updated. Be concise.`;

      const chatMessages = [
        { role: 'user' as const, content: systemContext },
        { role: 'assistant' as const, content: 'I understand. I\'ll help you edit this agent. What would you like to change?' },
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

      // Handle SSE streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

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
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      // Add the complete message
      if (accumulatedContent) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: accumulatedContent,
          timestamp: new Date(),
        };
        const newMessages = [...messages, userMessage, assistantMessage];
        setMessages(newMessages);
        setStreamingContent('');

        // Extract and apply updates
        await extractAndUpdate(newMessages);
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
    setError(null);
    setLastUpdate(null);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <ScrollArea className="flex-1 bg-muted/30">
        <div className="mx-auto w-full max-w-3xl px-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Edit with Chat</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                Describe changes to <strong>{story.name || 'this agent'}</strong> in natural language.
                Changes are automatically applied.
              </p>
              <div className="mt-6 grid gap-2 text-left text-sm text-muted-foreground">
                <p className="flex items-start gap-2">
                  <span className="text-primary">&bull;</span>
                  <span>&quot;Change the name to Customer Support Bot&quot;</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary">&bull;</span>
                  <span>&quot;Set autonomy to supervised&quot;</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary">&bull;</span>
                  <span>&quot;Add a skill for handling refund requests&quot;</span>
                </p>
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
                  <span>Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Update Notification */}
      {lastUpdate && (
        <div className="border-t bg-green-50 dark:bg-green-950/30 px-4 py-2 shrink-0">
          <div className="mx-auto w-full max-w-3xl flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Updated: {lastUpdate}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-auto w-full max-w-3xl px-4 pb-2 shrink-0">
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-background p-4 shrink-0">
        <div className="mx-auto w-full max-w-3xl">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe changes to your agent..."
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
            Press Enter to send. Changes auto-save to Story tab.
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

  return (
    <div className="w-full">
      {isUser ? (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-background px-4 py-3 shadow-sm">
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            {isStreaming && (
              <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-primary" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
