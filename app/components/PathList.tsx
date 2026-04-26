'use client';

import { useState } from 'react';
import { DragIcon, EyeIcon, EyeOffIcon } from './Icons';
import type { PathItem } from '../lib/types';

const PALETTE = [
  '#ffffff', '#a78bfa', '#ec4899', '#f59e0b',
  '#06b6d4', '#10b981', '#f43f5e', '#fbbf24',
  '#0a0a14', '#525252',
];

interface Props {
  paths: PathItem[];
  onChange: (paths: PathItem[]) => void;
}

export default function PathList({ paths, onChange }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [colorOpen, setColorOpen] = useState<string | null>(null);

  const move = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const fromIdx = paths.findIndex((p) => p.id === fromId);
    const toIdx = paths.findIndex((p) => p.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...paths];
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);
    onChange(next.map((p, i) => ({ ...p, order: i })));
  };

  const toggleVisible = (id: string) => {
    onChange(paths.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p)));
  };

  const setColor = (id: string, color: string) => {
    onChange(paths.map((p) => (p.id === id ? { ...p, stroke: color } : p)));
  };

  const resetDrag = () => {
    setDragId(null);
    setOverId(null);
  };

  return (
    <div>
      <div
        style={{
          fontSize: 10.5,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          color: '#a1a1aa',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontWeight: 600,
          marginBottom: 8,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Paths · drag to reorder</span>
        <span>{paths.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {paths.map((p, i) => {
          const isDragging = dragId === p.id;
          const isOver = overId === p.id && dragId !== p.id;
          const borderColor = isOver ? '#7c3aed' : isDragging ? '#a78bfa' : colorOpen === p.id ? '#a78bfa' : '#ededed';
          return (
            <div
              key={p.id}
              draggable
              onDragStart={(e) => {
                setDragId(p.id);
                e.dataTransfer.effectAllowed = 'move';
                // Setting any data is required for Firefox to start a drag.
                e.dataTransfer.setData('text/plain', p.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (overId !== p.id) setOverId(p.id);
              }}
              onDragLeave={(e) => {
                // Only clear when actually leaving this row (not entering child).
                const related = e.relatedTarget as Node | null;
                if (!related || !e.currentTarget.contains(related)) {
                  if (overId === p.id) setOverId(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = dragId ?? e.dataTransfer.getData('text/plain');
                if (id && id !== p.id) move(id, p.id);
                resetDrag();
              }}
              onDragEnd={resetDrag}
              style={{
                background: '#fff',
                border: `1px solid ${borderColor}`,
                borderRadius: 8,
                opacity: isDragging ? 0.5 : p.visible ? 1 : 0.55,
                transition: 'border-color 0.1s, opacity 0.1s',
              }}
            >
              <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'grab' }}>
                <span style={{ color: '#a1a1aa', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <DragIcon />
                </span>
                <button
                  onClick={() => setColorOpen(colorOpen === p.id ? null : p.id)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 5,
                    background: p.stroke,
                    border: `1px solid ${p.stroke === '#ffffff' ? '#ededed' : 'transparent'}`,
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, fontSize: 12, color: '#0a0a14', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </span>
                <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 10, color: '#71717a', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <button
                  onClick={() => toggleVisible(p.id)}
                  style={{ background: 'none', border: 'none', color: p.visible ? '#3f3f46' : '#d4d4d8', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                >
                  {p.visible ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>
              {colorOpen === p.id && (
                <div style={{ padding: '0 10px 10px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: 8, background: '#fafafa', borderRadius: 6 }}>
                    {PALETTE.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(p.id, c)}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 5,
                          background: c,
                          border: `2px solid ${p.stroke === c ? '#7c3aed' : 'transparent'}`,
                          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
