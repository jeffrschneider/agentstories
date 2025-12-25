'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, MessageSquare, Play, FileOutput, ArrowRight, RotateCcw } from 'lucide-react';
import { AppShell } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIdeation, ideationActions } from '@/stores';

interface IdeationLayoutProps {
  children: React.ReactNode;
}

const tabs = [
  { title: 'Chat', href: '/ideation', icon: MessageSquare },
  { title: 'Try It', href: '/ideation/try', icon: Play },
  { title: 'Export', href: '/ideation/export', icon: FileOutput },
];

export default function IdeationLayout({ children }: IdeationLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const ideation = useIdeation();
  const agentName = ideation.ideatedAgent.name;
  const hasAgent = agentName && agentName.trim() !== '';

  const handleNewAgent = () => {
    ideationActions.clearChat();
    router.push('/ideation');
  };

  const handlePromote = () => {
    // TODO: Navigate to create story with pre-filled data
    router.push('/stories/new?from=ideation');
  };

  return (
    <AppShell className="p-0">
      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        {/* Persistent Agent Context Header */}
        <div className="border-b bg-muted/30 px-4 py-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                {hasAgent ? (
                  <>
                    <h2 className="text-sm font-semibold">{agentName}</h2>
                    <p className="text-xs text-muted-foreground">
                      {ideation.ideatedAgent.purpose || 'No purpose defined yet'}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-sm font-semibold text-muted-foreground">No agent yet</h2>
                    <p className="text-xs text-muted-foreground">
                      Start a conversation to ideate your agent
                    </p>
                  </>
                )}
              </div>
              {hasAgent && ideation.ideatedAgent.autonomyLevel && (
                <Badge variant="outline" className="text-xs capitalize">
                  {ideation.ideatedAgent.autonomyLevel}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hasAgent && (
                <>
                  <Button variant="outline" size="sm" onClick={handleNewAgent}>
                    <RotateCcw className="mr-2 h-3 w-3" />
                    New Agent
                  </Button>
                  <Button size="sm" onClick={handlePromote}>
                    Promote to Portfolio
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b px-4 shrink-0">
          <nav className="flex gap-4">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.title}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </AppShell>
  );
}
