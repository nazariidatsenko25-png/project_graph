'use client';

import React, { useState, useMemo } from 'react';
import { Settings, Download, RotateCcw, PanelRightClose, PanelRightOpen, Code, Image as ImageIcon, Box, Frame } from 'lucide-react';
import { useGraphStore, ScalingMode } from '../store/useGraphStore';
import { findShortestPath } from '../utils/pathfinding';
import clsx from 'clsx';

type ControlPanelProps = {
  onExportPng: () => void;
  onExportSvg: () => void;
  onExportJson: () => void;
};

export default function ControlPanel({ onExportPng, onExportSvg, onExportJson }: ControlPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const {
    graphData,
    settings,
    updateSettings,
    pathStart,
    setPathStart,
    pathEnd,
    setPathEnd,
    reset,
    is3DMode,
    set3DMode,
  } = useGraphStore();

  const nodeCount = graphData?.nodes?.length || 0;
  const linkCount = graphData?.links?.length || 0;

  const metrics = useMemo(() => {
    if (!graphData) return null;
    const maxDegree = graphData.nodes.reduce((max, node) => {
      const degree = graphData.links.filter(l => 
        (typeof l.source === 'object' ? l.source.id : l.source) === node.id || 
        (typeof l.target === 'object' ? l.target.id : l.target) === node.id
      ).length;
      return Math.max(max, degree);
    }, 0);
    const density = nodeCount > 1 ? (2 * linkCount) / (nodeCount * (nodeCount - 1)) : 0;
    return { maxDegree, density: density.toFixed(3) };
  }, [graphData, nodeCount, linkCount]);

  const shortestPath = useMemo(() => {
    if (graphData && pathStart && pathEnd) {
      return findShortestPath(graphData, pathStart, pathEnd);
    }
    return null;
  }, [graphData, pathStart, pathEnd]);

  if (collapsed) {
    return (
      <button
        className="absolute top-6 right-6 z-20 w-10 h-10 flex items-center justify-center bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-full text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.1)] transition-colors shadow-lg"
        onClick={() => setCollapsed(false)}
        title="Open controls"
      >
        <PanelRightOpen size={20} />
      </button>
    );
  }

  return (
    <div className="absolute top-6 right-6 z-20 w-80 glass-panel rounded-[var(--radius-md)] flex flex-col max-h-[calc(100vh-48px)] animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
        <h3 className="flex items-center gap-2 m-0 text-sm font-semibold uppercase tracking-wider text-[var(--foreground)]">
          <Settings size={18} /> Controls
        </h3>
        <button 
          className="text-[var(--text-secondary)] hover:text-white transition-colors"
          onClick={() => setCollapsed(true)} 
          title="Collapse panel"
        >
          <PanelRightClose size={18} />
        </button>
      </div>

      <div className="overflow-y-auto p-5 flex flex-col gap-5">
        {/* Stats badges */}
        <div className="flex gap-2 mb-1">
          <div className="flex-1 text-center py-2 px-3 bg-[rgba(34,211,238,0.1)] rounded-[var(--radius-sm)] border border-[var(--glass-border)]">
            <div className="font-['Space_Grotesk'] font-bold text-xl text-[var(--accent)]">{nodeCount}</div>
            <div className="text-[10px] text-[var(--text-secondary)] tracking-wider uppercase">Vertices</div>
          </div>
          <div className="flex-1 text-center py-2 px-3 bg-[rgba(129,140,248,0.1)] rounded-[var(--radius-sm)] border border-[var(--glass-border)]">
            <div className="font-['Space_Grotesk'] font-bold text-xl text-[var(--highlight)]">{linkCount}</div>
            <div className="text-[10px] text-[var(--text-secondary)] tracking-wider uppercase">Edges</div>
          </div>
        </div>

        {metrics && (
          <div className="flex justify-between text-xs text-[var(--text-secondary)] px-1">
            <span>Max Degree: <strong className="text-white">{metrics.maxDegree}</strong></span>
            <span>Density: <strong className="text-white">{metrics.density}</strong></span>
          </div>
        )}

        <div className="h-px bg-[var(--glass-border)] w-full my-1" />

        {/* 2D / 3D Toggle */}
        <div className="flex items-center justify-between p-1">
          <span className="text-sm font-semibold tracking-wider text-[var(--foreground)] uppercase flex items-center gap-2">
            {is3DMode ? <Box size={16} className="text-[var(--accent)]" /> : <Frame size={16} className="text-[var(--highlight)]" />}
            Mode
          </span>
          <div className="flex items-center bg-[rgba(0,0,0,0.3)] rounded-lg p-1 border border-[var(--glass-border)]">
            <button
              onClick={() => set3DMode(false)}
              className={clsx(
                "px-3 py-1 text-xs font-bold rounded-md transition-all duration-200",
                !is3DMode ? "bg-[var(--highlight)] text-[#0b1021] shadow-[0_0_10px_rgba(129,140,248,0.3)]" : "text-[var(--text-secondary)] hover:text-white"
              )}
            >
              2D
            </button>
            <button
              onClick={() => set3DMode(true)}
              className={clsx(
                "px-3 py-1 text-xs font-bold rounded-md transition-all duration-200",
                is3DMode ? "bg-[var(--accent)] text-[#0b1021] shadow-[0_0_10px_rgba(34,211,238,0.3)]" : "text-[var(--text-secondary)] hover:text-white"
              )}
            >
              3D
            </button>
          </div>
        </div>

        <div className="h-px bg-[var(--glass-border)] w-full my-1" />

        {/* Toggle: Scaling Mode */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Scaling Mode</label>
          <select 
            value={settings.scalingMode} 
            onChange={(e) => updateSettings({ scalingMode: e.target.value as ScalingMode })}
            className="w-full p-2 mt-1 rounded bg-[rgba(0,0,0,0.3)] text-white border border-[var(--border-subtle)] text-sm outline-none focus:border-[var(--accent)] transition-colors"
          >
            <option value="linear">Linear (Direct)</option>
            <option value="sqrt">Square Root</option>
            <option value="log">Logarithmic</option>
          </select>
        </div>

        {/* Toggle: Show Labels */}
        <div className="flex justify-between items-center py-1">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Show Labels</span>
          <button
            className={clsx(
              "relative w-10 h-5 rounded-full transition-colors duration-200 outline-none",
              settings.showLabels ? "bg-[var(--success)]" : "bg-[rgba(255,255,255,0.2)]"
            )}
            onClick={() => updateSettings({ showLabels: !settings.showLabels })}
          >
            <span 
              className={clsx(
                "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200",
                settings.showLabels ? "translate-x-5" : "translate-x-0"
              )} 
            />
          </button>
        </div>

        {/* Sliders */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm font-medium text-[var(--text-secondary)]">
            <span>Node Size</span>
            <span className="text-[var(--accent)] font-mono">{settings.nodeMultiplier}×</span>
          </div>
          <input
            type="range" min="0.5" max="10" step="0.5"
            value={settings.nodeMultiplier}
            onChange={(e) => updateSettings({ nodeMultiplier: parseFloat(e.target.value) })}
            className="w-full accent-[var(--accent)] h-1 bg-[var(--border-subtle)] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm font-medium text-[var(--text-secondary)]">
            <span>Edge Thickness</span>
            <span className="text-[var(--accent)] font-mono">{settings.linkMultiplier}×</span>
          </div>
          <input
            type="range" min="0.1" max="5" step="0.1"
            value={settings.linkMultiplier}
            onChange={(e) => updateSettings({ linkMultiplier: parseFloat(e.target.value) })}
            className="w-full accent-[var(--accent)] h-1 bg-[var(--border-subtle)] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm font-medium text-[var(--text-secondary)]">
            <span>Repulsion</span>
            <span className="text-[var(--accent)] font-mono">{Math.abs(settings.charge)}</span>
          </div>
          <input
            type="range" min="-1000" max="-10" step="10"
            value={settings.charge}
            onChange={(e) => updateSettings({ charge: parseInt(e.target.value) })}
            className="w-full accent-[var(--accent)] h-1 bg-[var(--border-subtle)] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm font-medium text-[var(--text-secondary)]">
            <span>Link Distance</span>
            <span className="text-[var(--accent)] font-mono">{settings.linkDistance}px</span>
          </div>
          <input
            type="range" min="10" max="300" step="10"
            value={settings.linkDistance}
            onChange={(e) => updateSettings({ linkDistance: parseInt(e.target.value) })}
            className="w-full accent-[var(--accent)] h-1 bg-[var(--border-subtle)] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="h-px bg-[var(--glass-border)] w-full my-1" />

        {/* Shortest Path */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm font-medium text-[var(--highlight)]">
            <span>Shortest Path</span>
            {shortestPath?.totalCost != null && (
              <span>Cost: {shortestPath.totalCost}</span>
            )}
            {shortestPath && shortestPath.totalCost == null && (
              <span className="text-[var(--danger)]">No path</span>
            )}
          </div>
          <div className="flex gap-2">
            <select 
              value={pathStart} 
              onChange={(e) => setPathStart(e.target.value)}
              className="flex-1 p-2 rounded bg-[rgba(0,0,0,0.3)] text-white border border-[var(--border-subtle)] text-xs outline-none focus:border-[var(--highlight)] transition-colors"
            >
              <option value="">Start Node</option>
              {graphData?.nodes?.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
            </select>
            <select 
              value={pathEnd} 
              onChange={(e) => setPathEnd(e.target.value)}
              className="flex-1 p-2 rounded bg-[rgba(0,0,0,0.3)] text-white border border-[var(--border-subtle)] text-xs outline-none focus:border-[var(--highlight)] transition-colors"
            >
              <option value="">End Node</option>
              {graphData?.nodes?.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
            </select>
          </div>
          <button 
            className="w-full mt-1 p-2 rounded text-xs font-semibold uppercase tracking-wider text-white border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            onClick={() => {
              setPathStart('');
              setPathEnd('');
            }}
            disabled={!pathStart && !pathEnd}
          >
            Clear Selection
          </button>
        </div>

        <div className="h-px bg-[var(--glass-border)] w-full my-1" />

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pb-2">
          <button className="flex items-center justify-center gap-2 p-2 text-xs font-semibold bg-white text-[#0b1021] rounded hover:bg-gray-200 transition-colors" onClick={onExportPng} title="Export PNG">
            <ImageIcon size={14} /> PNG
          </button>
          <button className="flex items-center justify-center gap-2 p-2 text-xs font-semibold bg-[rgba(129,140,248,0.15)] text-[var(--highlight)] rounded hover:bg-[rgba(129,140,248,0.25)] transition-colors border border-[rgba(129,140,248,0.3)]" onClick={onExportSvg} title="Export SVG">
            <Download size={14} /> SVG
          </button>
          <button className="flex items-center justify-center gap-2 p-2 text-xs font-semibold bg-[rgba(255,255,255,0.1)] text-white rounded hover:bg-[rgba(255,255,255,0.2)] transition-colors border border-[rgba(255,255,255,0.2)]" onClick={onExportJson} title="Export JSON">
            <Code size={14} /> JSON
          </button>
          <button className="flex items-center justify-center gap-2 p-2 text-xs font-semibold bg-transparent text-[var(--text-secondary)] rounded hover:bg-[rgba(255,255,255,0.05)] hover:text-white transition-colors border border-transparent" onClick={reset} title="Upload a new file">
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}
