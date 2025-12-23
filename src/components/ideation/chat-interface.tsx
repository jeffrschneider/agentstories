'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIdeation, ideationActions, type ChatMessage } from '@/stores';

interface ChatInterfaceProps {
  onExtract?: () => void;
}

export function ChatInterface({ onExtract }: ChatInterfaceProps) {
  const ideation = useIdeation();
  const [input, setInput] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [ideation.messages, scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || ideation.isLoading) return;

    // Add user message
    ideationActions.addMessage('user', trimmedInput);
    setInput('');
    ideationActions.setLoading(true);
    ideationActions.setError(null);

    try {
      // Get all messages for context
      const messages = [
        ...ideation.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user' as const, content: trimmedInput },
      ];

      const response = await fetch('/api/ideation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
      }

      const data = await response.json();
      ideationActions.addMessage('assistant', data.message);

      // Trigger extraction after assistant response
      if (onExtract) {
        onExtract();
      }
    } catch (error) {
      ideationActions.setError(
        error instanceof Error ? error.message : 'An error occurred'
      );
    } finally {
      ideationActions.setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleClearChat = () => {
    ideationActions.clearChat();
    textareaRef.current?.focus();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4">
        {ideation.messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Agent Ideation</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Describe the AI agent you want to build. I&apos;ll help you define its
              purpose, skills, behaviors, and guardrails using the Agent Stories
              framework.
            </p>
            <div className="mt-6 grid gap-2 text-left text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>What problem should this agent solve?</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>What tasks will it perform?</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>How should it interact with humans?</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {ideation.messages.map((message: ChatMessage) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {ideation.isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Error Display */}
      {ideation.error && (
        <div className="mx-4 mb-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {ideation.error}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your agent idea..."
              className="min-h-[60px] resize-none pr-12"
              disabled={ideation.isLoading}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || ideation.isLoading}
            >
              {ideation.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            {ideation.messages.length > 0 && (
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
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-4 py-2 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <div className="prose max-w-none text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
