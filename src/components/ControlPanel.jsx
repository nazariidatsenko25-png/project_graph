import React, { useState, useMemo } from 'react';
import { Settings, Download, RotateCcw, PanelRightClose, PanelRightOpen, Code, Image } from 'lucide-react';
import './ControlPanel.css';

const ControlPanel = ({ graphData, settings, setSettings, onExport, onExportSvg, onExportJson, onReset }) => {
  const [collapsed, setCollapsed] = useState(false);

  const nodeCount = graphData?.nodes?.length || 0;
  const linkCount = graphData?.links?.length || 0;

  const metrics = useMemo(() => {
    if (!graphData) return null;
    const maxDegree = graphData.nodes.reduce((max, node) => {
      const degree = graphData.links.filter(l => l.source.id === node.id || l.target.id === node.id || l.source === node.id || l.target === node.id).length;
      return Math.max(max, degree);
    }, 0);
    const density = nodeCount > 1 ? (2 * linkCount) / (nodeCount * (nodeCount - 1)) : 0;
    return { maxDegree, density: density.toFixed(3) };
  }, [graphData, nodeCount, linkCount]);

  if (collapsed) {
    return (
      <button
        className="panel-toggle-btn"
        onClick={() => setCollapsed(false)}
        title="Open controls"
      >
        <PanelRightOpen size={20} />
      </button>
    );
  }

  return (
    <div className={`control-panel glass-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="panel-header">
        <h3>
          <Settings size={18} />
          Controls
        </h3>
        <button className="icon-btn" onClick={() => setCollapsed(true)} title="Collapse panel">
          <PanelRightClose size={18} />
        </button>
      </div>

      {/* Stats badges */}
      <div style={{
        display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)',
      }}>
        <div style={{
          flex: 1, textAlign: 'center', padding: 'var(--sp-2) var(--sp-3)',
          background: 'var(--accent-dim)', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--glass-border)',
        }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--accent)' }}>
            {nodeCount}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Vertices
          </div>
        </div>
        <div style={{
          flex: 1, textAlign: 'center', padding: 'var(--sp-2) var(--sp-3)',
          background: 'var(--highlight-dim)', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--glass-border)',
        }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--highlight)' }}>
            {linkCount}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Edges
          </div>
        </div>
      </div>

      {metrics && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 'var(--sp-5)', padding: '0 5px' }}>
          <span>Max Degree: <strong style={{color: 'var(--text-primary)'}}>{metrics.maxDegree}</strong></span>
          <span>Density: <strong style={{color: 'var(--text-primary)'}}>{metrics.density}</strong></span>
        </div>
      )}

      {/* Toggle: Scaling Mode */}
      <div className="control-group">
        <label>
          <div className="label-row">
            <span>Scaling Mode</span>
          </div>
          <select 
            value={settings.scalingMode} 
            onChange={(e) => setSettings({ ...settings, scalingMode: e.target.value })}
            style={{ width: '100%', padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-subtle)', marginTop: '8px' }}
          >
            <option value="linear">Linear (Direct)</option>
            <option value="sqrt">Square Root</option>
            <option value="log">Logarithmic</option>
          </select>
        </label>
      </div>

      {/* Toggle: Show Labels */}
      <div className="toggle-row">
        <span>Show Labels</span>
        <button
          className={`toggle-switch ${settings.showLabels ? 'active' : ''}`}
          onClick={() => setSettings({ ...settings, showLabels: !settings.showLabels })}
        />
      </div>

      {/* Sliders */}
      <div className="control-group">
        <label>
          <div className="label-row">
            <span>Node Size</span>
            <span className="label-value">{settings.nodeMultiplier}×</span>
          </div>
          <input
            type="range" min="0.5" max="10" step="0.5"
            value={settings.nodeMultiplier}
            onChange={(e) => setSettings({ ...settings, nodeMultiplier: parseFloat(e.target.value) })}
          />
        </label>
      </div>

      <div className="control-group">
        <label>
          <div className="label-row">
            <span>Edge Thickness</span>
            <span className="label-value">{settings.linkMultiplier}×</span>
          </div>
          <input
            type="range" min="0.1" max="5" step="0.1"
            value={settings.linkMultiplier}
            onChange={(e) => setSettings({ ...settings, linkMultiplier: parseFloat(e.target.value) })}
          />
        </label>
      </div>

      <div className="control-group">
        <label>
          <div className="label-row">
            <span>Repulsion</span>
            <span className="label-value">{Math.abs(settings.charge)}</span>
          </div>
          <input
            type="range" min="-1000" max="-10" step="10"
            value={settings.charge}
            onChange={(e) => setSettings({ ...settings, charge: parseInt(e.target.value) })}
          />
        </label>
      </div>

      <div className="control-group">
        <label>
          <div className="label-row">
            <span>Link Distance</span>
            <span className="label-value">{settings.linkDistance}px</span>
          </div>
          <input
            type="range" min="10" max="300" step="10"
            value={settings.linkDistance}
            onChange={(e) => setSettings({ ...settings, linkDistance: parseInt(e.target.value) })}
          />
        </label>
      </div>

      <div className="panel-divider" />

      {/* Shortest Path */}
      <div className="control-group">
        <label>
          <div className="label-row" style={{ color: 'var(--highlight)' }}>
            <span>Shortest Path</span>
            {settings.shortestPath?.totalCost != null && (
              <span className="label-value" style={{ color: 'var(--highlight)' }}>Cost: {settings.shortestPath.totalCost}</span>
            )}
            {settings.shortestPath && settings.shortestPath.totalCost == null && (
              <span className="label-value" style={{ color: '#f87171' }}>No path</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <select 
              value={settings.pathStart || ''} 
              onChange={(e) => settings.setPathStart(e.target.value)}
              style={{ flex: 1, padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-subtle)', width: '100%' }}
            >
              <option value="">Start Node</option>
              {graphData?.nodes?.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
            </select>
            <select 
              value={settings.pathEnd || ''} 
              onChange={(e) => settings.setPathEnd(e.target.value)}
              style={{ flex: 1, padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-subtle)', width: '100%' }}
            >
              <option value="">End Node</option>
              {graphData?.nodes?.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
            </select>
          </div>
          <button 
            className="btn" 
            style={{ 
              marginTop: '8px', width: '100%', padding: '6px', 
              background: 'rgba(255, 255, 255, 0.1)', 
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              opacity: (settings.pathStart || settings.pathEnd) ? 1 : 0.5,
              cursor: (settings.pathStart || settings.pathEnd) ? 'pointer' : 'not-allowed'
            }}
            onClick={() => {
              settings.setPathStart('');
              settings.setPathEnd('');
            }}
            disabled={!settings.pathStart && !settings.pathEnd}
          >
            Clear Selection
          </button>
        </label>
      </div>

      <div className="panel-divider" />

      {/* Actions */}
      <div className="panel-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button className="btn" onClick={onExport} title="Export PNG" style={{ padding: '8px' }}>
          <Image size={16} /> PNG
        </button>
        <button className="btn" onClick={onExportSvg} title="Export SVG" style={{ padding: '8px', background: 'var(--highlight-dim)', color: 'var(--highlight)' }}>
          <Download size={16} /> SVG
        </button>
        <button className="btn" onClick={onExportJson} title="Export JSON" style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', color: 'white' }}>
          <Code size={16} /> JSON
        </button>
        <button className="btn-ghost" onClick={onReset} title="Upload a new file" style={{ padding: '8px' }}>
          <RotateCcw size={16} /> Reset
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
