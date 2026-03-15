import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

const MN = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

interface MetricTooltipProps {
  title: string;
  children: React.ReactNode;
  /** Position absolute within parent. Defaults to top-right. */
  className?: string;
}

/**
 * Parse tooltip body content with inline markup:
 * - **text** → bold white
 * - !!text!! → gold highlight
 * - ~~text~~ → red highlight
 */
function renderBody(node: React.ReactNode): React.ReactNode {
  if (typeof node !== 'string') return node;

  const parts: React.ReactNode[] = [];
  // Combined regex for **bold**, !!gold!!, ~~red~~
  const regex = /\*\*(.+?)\*\*|!!(.+?)!!|~~(.+?)~~/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(node)) !== null) {
    if (match.index > lastIndex) {
      parts.push(node.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(<span key={match.index} style={{ color: '#FFFFFF', fontWeight: 600 }}>{match[1]}</span>);
    } else if (match[2]) {
      parts.push(<span key={match.index} style={{ color: '#D4A843', fontWeight: 600 }}>{match[2]}</span>);
    } else if (match[3]) {
      parts.push(<span key={match.index} style={{ color: '#EF4444', fontWeight: 600 }}>{match[3]}</span>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < node.length) {
    parts.push(node.slice(lastIndex));
  }
  return parts;
}

export function MetricTooltip({ title, children, className }: MetricTooltipProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleEnter = useCallback(() => {
    timerRef.current = setTimeout(() => setShow(true), 200);
  }, []);

  const handleLeave = useCallback(() => {
    clearTimeout(timerRef.current);
    setShow(false);
  }, []);

  // Position the tooltip
  useEffect(() => {
    if (!show || !iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    const tooltipW = 360;
    const tooltipH = 260; // estimate
    let left = rect.left + rect.width / 2 - tooltipW / 2;
    let top = rect.bottom + 8;

    // Clamp to viewport
    if (left < 8) left = 8;
    if (left + tooltipW > window.innerWidth - 8) left = window.innerWidth - tooltipW - 8;
    if (top + tooltipH > window.innerHeight - 8) {
      top = rect.top - tooltipH - 8;
    }

    setPos({ top, left });
  }, [show]);

  return (
    <>
      <span
        ref={iconRef}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className={className}
        style={{
          cursor: 'help',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 150ms',
          color: show ? '#D4A843' : 'rgba(212,168,67,0.4)',
          zIndex: 10,
        }}
      >
        <Info size={12} />
      </span>

      {show && pos && createPortal(
        <div
          ref={tooltipRef}
          onMouseEnter={() => clearTimeout(timerRef.current)}
          onMouseLeave={handleLeave}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: 360,
            background: '#1A2332',
            border: '1px solid rgba(212,168,67,0.2)',
            borderRadius: 10,
            padding: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(212,168,67,0.08)',
            zIndex: 99999,
            animation: 'mtFadeIn 150ms ease-out',
          }}
        >
          <div style={{ fontFamily: MN, fontSize: 12, color: '#D4A843', marginBottom: 8, fontWeight: 600 }}>
            {title}
          </div>
          <div style={{ fontFamily: MN, fontSize: 11, color: '#9CA3AF', lineHeight: 1.6 }}>
            {renderBody(children)}
          </div>
          <style>{`
            @keyframes mtFadeIn {
              from { opacity: 0; transform: translateY(4px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>,
        document.body
      )}
    </>
  );
}
