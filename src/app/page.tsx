'use client';

import React, { useCallback, useRef, useState } from 'react';
import FileUpload from '../components/FileUpload';
import GraphVisualizer from '../components/GraphVisualizer';
import GraphVisualizer3D from '../components/GraphVisualizer3D';
import ControlPanel from '../components/ControlPanel';
import { useGraphStore } from '../store/useGraphStore';
import { exportToPng, exportToJson, exportToSvg } from '../utils/export';

function HoverTooltip({
  label,
  value,
  extra,
  extraLabel,
}: {
  label: string;
  value: React.ReactNode;
  extra?: React.ReactNode;
  extraLabel?: string;
}) {
  return (
    <div
      role="tooltip"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-[var(--radius-md)] px-5 py-2.5 flex items-center gap-4 shadow-[var(--glass-shadow)] animate-in fade-in slide-in-from-bottom-4 pointer-events-none"
    >
      <span className="text-[var(--text-secondary)] text-sm" style={{ fontFamily: 'var(--font-ui)' }}>
        {label}
      </span>
      <span className="font-bold text-[var(--accent)] text-base" style={{ fontFamily: 'var(--font-mono)' }}>
        {value}
      </span>
      {extra != null && (
        <>
          <span className="w-px h-5 bg-[var(--border-subtle)]" />
          <span className="text-[var(--text-secondary)] text-sm" style={{ fontFamily: 'var(--font-ui)' }}>
            {extraLabel}
          </span>
          <span className="font-bold text-[var(--highlight)] text-base" style={{ fontFamily: 'var(--font-mono)' }}>
            {extra}
          </span>
        </>
      )}
    </div>
  );
}

export default function Page() {
  const { graphData, settings, hoverNode, hoverLink, is3DMode } = useGraphStore();
  const fgRef = useRef<unknown>(null);

  const handleSetFgRef = useCallback((ref: React.RefObject<unknown>) => {
    (fgRef as React.MutableRefObject<unknown>).current = ref.current;
  }, []);

  const handleExportPng = useCallback(() => {
    requestAnimationFrame(() => {
      const canvas = document.querySelector('canvas');
      exportToPng(canvas);
    });
  }, []);

  const handleExportSvg = useCallback(() => exportToSvg(graphData, settings), [graphData, settings]);
  const handleExportJson = useCallback(() => exportToJson(graphData), [graphData]);

  const edgeSource = hoverLink
    ? typeof hoverLink.source === 'object'
      ? (hoverLink.source as { id: string }).id
      : hoverLink.source
    : null;
  const edgeTarget = hoverLink
    ? typeof hoverLink.target === 'object'
      ? (hoverLink.target as { id: string }).id
      : hoverLink.target
    : null;

  return (
    <main className="min-h-screen relative overflow-hidden bg-[var(--background)]">
      <div className="scene-bg" />

      {!graphData ? (
        <FileUpload />
      ) : (
        <>
          {is3DMode ? (
            <GraphVisualizer3D setFgRef={handleSetFgRef} />
          ) : (
            <GraphVisualizer setFgRef={handleSetFgRef} />
          )}

          <ControlPanel
            onExportPng={handleExportPng}
            onExportSvg={handleExportSvg}
            onExportJson={handleExportJson}
          />

          {hoverNode && (
            <HoverTooltip
              label="Vertex"
              value={hoverNode}
              extraLabel="Weight"
              extra={graphData.nodes.find((n) => n.id === hoverNode)?.weight ?? '—'}
            />
          )}

          {hoverLink && !hoverNode && (
            <HoverTooltip
              label="Edge"
              value={`${edgeSource} → ${edgeTarget}`}
              extraLabel="Weight"
              extra={hoverLink.weight ?? '—'}
            />
          )}
        </>
      )}
    </main>
  );
}
