'use client';

import React, { useState, useMemo } from 'react';
import {
  Settings,
  Download,
  RotateCcw,
  PanelRightClose,
  PanelRightOpen,
  Code,
  Image as ImageIcon,
  Box,
  Frame,
  GitMerge,
} from 'lucide-react';
import { useGraphStore, ScalingMode } from '../store/useGraphStore';
import { findShortestPath } from '../utils/pathfinding';
import clsx from 'clsx';

type ControlPanelProps = {
  onExportPng: () => void;
  onExportSvg: () => void;
  onExportJson: () => void;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionDivider() {
  return <div className="h-px bg-[var(--glass-border)] w-full my-1" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)] pl-1">
      {children}
    </span>
  );
}

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  activeColor?: string;
};

function ToggleSwitch({ checked, onChange, label, activeColor = 'var(--success)' }: ToggleSwitchProps) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm font-medium text-[var(--text-secondary)]">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={clsx(
          'relative w-10 h-5 rounded-full transition-colors duration-200 outline-none cursor-pointer',
          checked ? `bg-[${activeColor}]` : 'bg-[rgba(255,255,255,0.2)]',
        )}
        style={{ backgroundColor: checked ? activeColor : undefined }}
        onClick={() => onChange(!checked)}
      >
        <span
          className={clsx(
            'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  );
}

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (v: number) => void;
  isFloat?: boolean;
};

function Slider({ label, value, min, max, step, displayValue, onChange, isFloat }: SliderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm font-medium text-[var(--text-secondary)]">
        <span>{label}</span>
        <span className="text-[var(--accent)] font-mono text-xs">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) =>
          onChange(isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10))
        }
        className="range-slider"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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
    isDirected,
    setDirected,
  } = useGraphStore();

  const nodeCount = graphData?.nodes?.length ?? 0;
  const linkCount = graphData?.links?.length ?? 0;

  const metrics = useMemo(() => {
    if (!graphData) return null;
    const maxDegree = graphData.nodes.reduce((max, node) => {
      const degree = graphData.links.filter((l) => {
        const srcId = typeof l.source === 'object' ? l.source.id : l.source;
        const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
        return srcId === node.id || tgtId === node.id;
      }).length;
      return Math.max(max, degree);
    }, 0);
    const density = nodeCount > 1 ? (2 * linkCount) / (nodeCount * (nodeCount - 1)) : 0;
    return { maxDegree, density: density.toFixed(3) };
  }, [graphData, nodeCount, linkCount]);

  const shortestPath = useMemo(() => {
    if (graphData && pathStart && pathEnd) {
      return findShortestPath(graphData, pathStart, pathEnd, isDirected);
    }
    return null;
  }, [graphData, pathStart, pathEnd, isDirected]);

  if (collapsed) {
    return (
      <button
        className="absolute top-6 right-6 z-20 w-10 h-10 flex items-center justify-center bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-full text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.1)] transition-colors shadow-lg cursor-pointer"
        onClick={() => setCollapsed(false)}
        title="Open controls"
        aria-label="Open controls panel"
      >
        <PanelRightOpen size={20} />
      </button>
    );
  }

  return (
    <div className="absolute top-6 right-6 z-20 w-80 glass-panel rounded-[var(--radius-md)] flex flex-col max-h-[calc(100vh-48px)] animate-in fade-in slide-in-from-right-8 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
        <h3 className="flex items-center gap-2 m-0 text-sm font-semibold uppercase tracking-wider text-[var(--foreground)]"
            style={{ fontFamily: 'var(--font-ui)' }}>
          <Settings size={18} /> Controls
        </h3>
        <button
          className="text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
          onClick={() => setCollapsed(true)}
          title="Collapse panel"
          aria-label="Collapse controls panel"
        >
          <PanelRightClose size={18} />
        </button>
      </div>

      <div className="overflow-y-auto p-5 flex flex-col gap-4">
        {/* Stats */}
        <div className="flex gap-2">
          <div className="flex-1 text-center py-2.5 px-3 bg-[var(--accent-dim)] rounded-[var(--radius-sm)] border border-[var(--glass-border)]">
            <div className="font-bold text-xl text-[var(--accent)]" style={{ fontFamily: 'var(--font-mono)' }}>
              {nodeCount}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] tracking-wider uppercase mt-0.5">Vertices</div>
          </div>
          <div className="flex-1 text-center py-2.5 px-3 bg-[var(--highlight-dim)] rounded-[var(--radius-sm)] border border-[var(--glass-border)]">
            <div className="font-bold text-xl text-[var(--highlight)]" style={{ fontFamily: 'var(--font-mono)' }}>
              {linkCount}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] tracking-wider uppercase mt-0.5">Edges</div>
          </div>
        </div>

        {metrics && (
          <div className="flex justify-between text-xs text-[var(--text-secondary)] px-1">
            <span>Max Degree: <strong className="text-white" style={{ fontFamily: 'var(--font-mono)' }}>{metrics.maxDegree}</strong></span>
            <span>Density: <strong className="text-white" style={{ fontFamily: 'var(--font-mono)' }}>{metrics.density}</strong></span>
          </div>
        )}

        <SectionDivider />
        <SectionLabel>Render Mode</SectionLabel>

        {/* 2D / 3D Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
            {is3DMode ? <Box size={15} className="text-[var(--accent)]" /> : <Frame size={15} className="text-[var(--highlight)]" />}
            View
          </span>
          <div className="flex items-center bg-[rgba(0,0,0,0.3)] rounded-lg p-1 border border-[var(--glass-border)]">
            <button
              onClick={() => set3DMode(false)}
              className={clsx(
                'px-3 py-1 text-xs font-bold rounded-md transition-all duration-200 cursor-pointer',
                !is3DMode
                  ? 'bg-[var(--highlight)] text-[#080e1c] shadow-[0_0_10px_rgba(129,140,248,0.3)]'
                  : 'text-[var(--text-secondary)] hover:text-white',
              )}
            >
              2D
            </button>
            <button
              onClick={() => set3DMode(true)}
              className={clsx(
                'px-3 py-1 text-xs font-bold rounded-md transition-all duration-200 cursor-pointer',
                is3DMode
                  ? 'bg-[var(--accent)] text-[#080e1c] shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                  : 'text-[var(--text-secondary)] hover:text-white',
              )}
            >
              3D
            </button>
          </div>
        </div>

        {/* Directed / Undirected Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
            <GitMerge size={15} className={isDirected ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'} />
            Graph Type
          </span>
          <div className="flex items-center bg-[rgba(0,0,0,0.3)] rounded-lg p-1 border border-[var(--glass-border)]">
            <button
              onClick={() => setDirected(false)}
              className={clsx(
                'px-2.5 py-1 text-xs font-bold rounded-md transition-all duration-200 cursor-pointer',
                !isDirected
                  ? 'bg-[var(--highlight)] text-[#080e1c]'
                  : 'text-[var(--text-secondary)] hover:text-white',
              )}
            >
              Undirected
            </button>
            <button
              onClick={() => setDirected(true)}
              className={clsx(
                'px-2.5 py-1 text-xs font-bold rounded-md transition-all duration-200 cursor-pointer',
                isDirected
                  ? 'bg-[var(--accent)] text-[#080e1c]'
                  : 'text-[var(--text-secondary)] hover:text-white',
              )}
            >
              Directed
            </button>
          </div>
        </div>

        <SectionDivider />
        <SectionLabel>Appearance</SectionLabel>

        {/* Toggle: Scaling Mode */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Scaling Mode</label>
          <select
            value={settings.scalingMode}
            onChange={(e) => updateSettings({ scalingMode: e.target.value as ScalingMode })}
            className="w-full p-2 rounded bg-[rgba(0,0,0,0.3)] text-white border border-[var(--border-subtle)] text-sm outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
          >
            <option value="linear">Linear (Direct)</option>
            <option value="sqrt">Square Root</option>
            <option value="log">Logarithmic</option>
          </select>
        </div>

        <ToggleSwitch
          checked={settings.showLabels}
          onChange={(v) => updateSettings({ showLabels: v })}
          label="Show Labels"
        />

        <Slider
          label="Node Size"
          value={settings.nodeMultiplier}
          min={0.5}
          max={10}
          step={0.5}
          displayValue={`${settings.nodeMultiplier}×`}
          onChange={(v) => updateSettings({ nodeMultiplier: v })}
          isFloat
        />

        <Slider
          label="Edge Thickness"
          value={settings.linkMultiplier}
          min={0.1}
          max={5}
          step={0.1}
          displayValue={`${settings.linkMultiplier}×`}
          onChange={(v) => updateSettings({ linkMultiplier: v })}
          isFloat
        />

        <Slider
          label="Repulsion"
          value={settings.charge}
          min={-1000}
          max={-10}
          step={10}
          displayValue={`${Math.abs(settings.charge)}`}
          onChange={(v) => updateSettings({ charge: v })}
        />

        <Slider
          label="Link Distance"
          value={settings.linkDistance}
          min={10}
          max={300}
          step={10}
          displayValue={`${settings.linkDistance}px`}
          onChange={(v) => updateSettings({ linkDistance: v })}
        />

        <SectionDivider />
        <SectionLabel>Shortest Path</SectionLabel>

        {/* Shortest Path */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm font-medium text-[var(--highlight)]">
            <span>{isDirected ? 'Directed path' : 'Undirected path'}</span>
            {shortestPath?.totalCost != null && (
              <span style={{ fontFamily: 'var(--font-mono)' }}>Cost: {shortestPath.totalCost}</span>
            )}
            {shortestPath && shortestPath.totalCost == null && (
              <span className="text-[var(--danger)]">No path</span>
            )}
          </div>
          <div className="flex gap-2">
            <select
              value={pathStart}
              onChange={(e) => setPathStart(e.target.value)}
              className="flex-1 p-2 rounded bg-[rgba(0,0,0,0.3)] text-white border border-[var(--border-subtle)] text-xs outline-none focus:border-[var(--highlight)] transition-colors cursor-pointer"
            >
              <option value="">Start Node</option>
              {graphData?.nodes?.map((n) => <option key={n.id} value={n.id}>{n.id}</option>)}
            </select>
            <select
              value={pathEnd}
              onChange={(e) => setPathEnd(e.target.value)}
              className="flex-1 p-2 rounded bg-[rgba(0,0,0,0.3)] text-white border border-[var(--border-subtle)] text-xs outline-none focus:border-[var(--highlight)] transition-colors cursor-pointer"
            >
              <option value="">End Node</option>
              {graphData?.nodes?.map((n) => <option key={n.id} value={n.id}>{n.id}</option>)}
            </select>
          </div>
          <button
            className="w-full mt-1 p-2 rounded text-xs font-semibold uppercase tracking-wider text-white border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.07)] hover:bg-[rgba(255,255,255,0.12)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            onClick={() => { setPathStart(''); setPathEnd(''); }}
            disabled={!pathStart && !pathEnd}
          >
            Clear Selection
          </button>
        </div>

        <SectionDivider />
        <SectionLabel>Export & Actions</SectionLabel>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pb-2">
          <button
            className="flex items-center justify-center gap-2 p-2 text-xs font-semibold bg-white text-[#080e1c] rounded hover:bg-[var(--foreground)] transition-colors cursor-pointer"
            onClick={onExportPng}
            title="Export PNG"
          >
            <ImageIcon size={14} /> PNG
          </button>
          <button
            className="flex items-center justify-center gap-2 p-2 text-xs font-semibold bg-[var(--highlight-dim)] text-[var(--highlight)] rounded hover:bg-[rgba(129,140,248,0.25)] transition-colors border border-[rgba(129,140,248,0.3)] cursor-pointer"
            onClick={onExportSvg}
            title="Export SVG"
          >
            <Download size={14} /> SVG
          </button>
          <button
            className="flex items-center justify-center gap-2 p-2 text-xs font-semibold bg-[rgba(255,255,255,0.07)] text-white rounded hover:bg-[rgba(255,255,255,0.14)] transition-colors border border-[rgba(255,255,255,0.15)] cursor-pointer"
            onClick={onExportJson}
            title="Export JSON"
          >
            <Code size={14} /> JSON
          </button>
          <button
            className="flex items-center justify-center gap-2 p-2 text-xs font-semibold bg-transparent text-[var(--text-secondary)] rounded hover:bg-[rgba(255,255,255,0.05)] hover:text-white transition-colors border border-transparent cursor-pointer"
            onClick={reset}
            title="Upload a new file"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}
