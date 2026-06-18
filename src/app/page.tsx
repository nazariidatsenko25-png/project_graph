'use client';

import React, { useCallback, useState } from 'react';
import FileUpload from '../components/FileUpload';
import GraphVisualizer from '../components/GraphVisualizer';
import ControlPanel from '../components/ControlPanel';
import { useGraphStore } from '../store/useGraphStore';
import { exportToPng, exportToJson, exportToSvg } from '../utils/export';

export default function Page() {
  const { graphData, settings, hoverNode, hoverLink } = useGraphStore();
  const [fgRef, setFgRef] = useState<any>(null);

  const handleExportPng = useCallback(() => {
    if (!fgRef || !fgRef.current) return;
    requestAnimationFrame(() => {
      const canvas = document.querySelector('canvas');
      exportToPng(canvas);
    });
  }, [fgRef]);

  const handleExportSvg = useCallback(() => {
    exportToSvg(graphData, settings);
  }, [graphData, settings]);

  const handleExportJson = useCallback(() => {
    exportToJson(graphData);
  }, [graphData]);

  return (
    <main className="min-h-screen relative overflow-hidden bg-[var(--background)]">
      {/* Animated ambient background */}
      <div className="scene-bg" />

      {!graphData ? (
        <FileUpload />
      ) : (
        <>
          <GraphVisualizer setFgRef={setFgRef} />
          
          <ControlPanel
            onExportPng={handleExportPng}
            onExportSvg={handleExportSvg}
            onExportJson={handleExportJson}
          />

          {/* Hover tooltip showing node weight */}
          {hoverNode && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-[var(--radius-md)] px-5 py-2.5 flex items-center gap-4 shadow-[var(--glass-shadow)] animate-in fade-in slide-in-from-bottom-4">
              <span className="text-[var(--text-secondary)] text-sm font-['Space_Grotesk']">Vertex</span>
              <span className="font-bold text-[var(--accent)] text-base font-['Space_Grotesk']">
                {hoverNode}
              </span>
              <span className="w-px h-5 bg-[var(--border-subtle)]" />
              <span className="text-[var(--text-secondary)] text-sm font-['Space_Grotesk']">Weight</span>
              <span className="font-bold text-[var(--highlight)] text-base font-['Space_Grotesk']">
                {graphData.nodes.find((n) => n.id === hoverNode)?.weight ?? '—'}
              </span>
            </div>
          )}

          {/* Hover tooltip showing edge weight */}
          {hoverLink && !hoverNode && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-[var(--radius-md)] px-5 py-2.5 flex items-center gap-4 shadow-[var(--glass-shadow)] animate-in fade-in slide-in-from-bottom-4">
              <span className="text-[var(--text-secondary)] text-sm font-['Space_Grotesk']">Edge</span>
              <span className="font-bold text-[var(--accent)] text-base font-['Space_Grotesk']">
                {typeof hoverLink.source === 'object' ? (hoverLink.source as any).id : hoverLink.source} →{' '}
                {typeof hoverLink.target === 'object' ? (hoverLink.target as any).id : hoverLink.target}
              </span>
              <span className="w-px h-5 bg-[var(--border-subtle)]" />
              <span className="text-[var(--text-secondary)] text-sm font-['Space_Grotesk']">Weight</span>
              <span className="font-bold text-[var(--highlight)] text-base font-['Space_Grotesk']">
                {hoverLink.weight ?? '—'}
              </span>
            </div>
          )}
        </>
      )}
    </main>
  );
}
