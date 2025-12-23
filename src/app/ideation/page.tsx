'use client';

import * as React from 'react';
import { AppShell } from '@/components/layout';
import { ChatInterface, AgentPanel } from '@/components/ideation';
import { useIdeation, ideationActions } from '@/stores';
import type { IdeatedAgent } from '@/lib/ideation/agent-context';

export default function IdeationPage() {
  const ideation = useIdeation();
  const [isExtracting, setIsExtracting] = React.useState(false);

  const handleExtract = React.useCallback(async () => {
    // Only extract if there are enough messages
    if (ideation.messages.length < 2) return;

    setIsExtracting(true);
    try {
      const messages = ideation.messages.map((m) => ({
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
  }, [ideation.messages]);

  const handleRefreshExtract = React.useCallback(() => {
    handleExtract();
  }, [handleExtract]);

  return (
    <AppShell className="p-0">
      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        {/* Main Content - Chat and Panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 min-w-0">
            <ChatInterface onExtract={handleExtract} />
          </div>

          {/* Agent Specification Panel */}
          <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0">
            <AgentPanel
              isExtracting={isExtracting}
              onRefresh={handleRefreshExtract}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
