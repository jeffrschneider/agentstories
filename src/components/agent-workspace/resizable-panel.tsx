'use client';

import * as React from 'react';
import { GripVertical } from 'lucide-react';

interface ResizablePanelProps {
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  isExpanded?: boolean;
  expandedWidth?: string;
  onWidthChange?: (width: number) => void;
  className?: string;
}

export function ResizablePanel({
  children,
  minWidth = 280,
  maxWidth = 600,
  defaultWidth = 320,
  isExpanded = false,
  expandedWidth = '50%',
  onWidthChange,
  className = '',
}: ResizablePanelProps) {
  const [width, setWidth] = React.useState(defaultWidth);
  const [isResizing, setIsResizing] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;

      const containerRect = panelRef.current.parentElement?.getBoundingClientRect();
      if (!containerRect) return;

      // Calculate new width from the right edge
      const newWidth = containerRect.right - e.clientX;
      const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);

      setWidth(clampedWidth);
      onWidthChange?.(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth, onWidthChange]);

  const panelStyle: React.CSSProperties = isExpanded
    ? { width: expandedWidth, flexShrink: 0 }
    : { width: `${width}px`, flexShrink: 0 };

  return (
    <div
      ref={panelRef}
      className={`relative border-l ${className}`}
      style={panelStyle}
    >
      {/* Resize handle */}
      {!isExpanded && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 group hover:bg-primary/20 ${
            isResizing ? 'bg-primary/30' : ''
          }`}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
