'use client';

import * as React from 'react';
import { ChatInterface, AgentPanel } from '@/components/ideation';
import { ideationActions, ideationStore } from '@/stores';
import type { IdeatedAgent } from '@/lib/ideation/agent-context';

export default function IdeationChatPage() {
  const [isExtracting, setIsExtracting] = React.useState(false);

  const handleExtract = React.useCallback(async () => {
    // Read directly from store to get latest messages (snapshot may be stale)
    const currentMessages = ideationStore.messages;
    if (currentMessages.length < 2) return;

    setIsExtracting(true);
    try {
      const messages = currentMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/ideation/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.agent) {
          ideationActions.updateIdeatedAgent(data.agent as IdeatedAgent);
        }
      }
    } catch (error) {
      console.error('Extraction error:', error);
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const handleRefreshExtract = React.useCallback(() => {
    handleExtract();
  }, [handleExtract]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Chat Area */}
      <div className="flex-1 min-w-0">
        <ChatInterface onExtract={handleExtract} />
      </div>

      {/* Agent Specification Panel */}
      <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0 border-l">
        <AgentPanel
          isExtracting={isExtracting}
          onRefresh={handleRefreshExtract}
        />
      </div>
    </div>
  );
}
