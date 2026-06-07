import React, { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import GraphVisualizer from './components/GraphVisualizer';
import ControlPanel from './components/ControlPanel';

function App() {
  const [graphData, setGraphData] = useState(null);
  const [fgRef, setFgRef] = useState(null);
  const [hoverNode, setHoverNode] = useState(null);

  const [settings, setSettings] = useState({
    nodeMultiplier: 3,
    linkMultiplier: 1.5,
    charge: -200,
    linkDistance: 80,
    showLabels: false,
  });

  const handleExport = useCallback(() => {
    if (!fgRef || !fgRef.current) return;

    requestAnimationFrame(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'graph-visualization.png';
        link.href = url;
        link.click();
      }
    });
  }, [fgRef]);

  const handleReset = useCallback(() => {
    setGraphData(null);
    setHoverNode(null);
  }, []);

  return (
    <>
      {/* Animated ambient background — always present */}
      <div className="scene-bg" />

      {!graphData ? (
        <FileUpload onDataLoaded={setGraphData} />
      ) : (
        <>
          <GraphVisualizer
            data={graphData}
            settings={{ ...settings, hoverNode, setHoverNode }}
            setFgRef={setFgRef}
          />
          <ControlPanel
            settings={settings}
            setSettings={setSettings}
            onExport={handleExport}
            onReset={handleReset}
            graphData={graphData}
          />

          {/* Hover tooltip showing node weight */}
          {hoverNode && (
            <div
              className="animate-fade"
              style={{
                position: 'absolute',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 20,
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 14,
                boxShadow: 'var(--glass-shadow)',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Vertex</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 16 }}>
                {hoverNode}
              </span>
              <span style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Weight</span>
              <span style={{ fontWeight: 700, color: 'var(--highlight)', fontSize: 16 }}>
                {graphData.nodes.find((n) => n.id === hoverNode)?.weight ?? '—'}
              </span>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default App;
