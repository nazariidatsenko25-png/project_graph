import React, { useState } from 'react';
import { Settings, Download, RotateCcw, PanelRightClose, PanelRightOpen } from 'lucide-react';
import './ControlPanel.css';

const ControlPanel = ({ settings, setSettings, onExport, onReset, graphData }) => {
  const [collapsed, setCollapsed] = useState(false);

  const nodeCount = graphData?.nodes?.length || 0;
  const linkCount = graphData?.links?.length || 0;

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

      {/* Actions */}
      <div className="panel-actions">
        <button className="btn" onClick={onExport}>
          <Download size={16} />
          Export PNG
        </button>
        <button className="btn-ghost" onClick={onReset} title="Upload a new file">
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
