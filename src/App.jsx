import React, { useState, useCallback, useMemo } from 'react';
import FileUpload from './components/FileUpload';
import GraphVisualizer from './components/GraphVisualizer';
import ControlPanel from './components/ControlPanel';

function App() {
  const [graphData, setGraphData] = useState(null);
  const [fgRef, setFgRef] = useState(null);
  const [hoverNode, setHoverNode] = useState(null);
  const [hoverLink, setHoverLink] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [pathStart, setPathStart] = useState('');
  const [pathEnd, setPathEnd] = useState('');

  const [settings, setSettings] = useState({
    nodeMultiplier: 3,
    linkMultiplier: 1.5,
    charge: -200,
    linkDistance: 80,
    showLabels: false,
    scalingMode: 'linear',
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

  const handleExportJson = useCallback(() => {
    if (!graphData) return;
    const dataStr = JSON.stringify(graphData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'graph-data.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [graphData]);

  const handleExportSvg = useCallback(() => {
    if (!graphData) return;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    graphData.nodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x > maxX) maxX = n.x;
      if (n.y > maxY) maxY = n.y;
    });
    
    const padding = 100;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const viewBox = `${minX - padding} ${minY - padding} ${width} ${height}`;
    
    const getScaledWeight = (w) => {
      if (settings.scalingMode === 'log') return Math.max(0.1, Math.log10(w + 1));
      if (settings.scalingMode === 'sqrt') return Math.max(0.1, Math.sqrt(w));
      return w;
    };
    
    const weightToColor = (weight, minW, maxW) => {
      if (maxW === minW) return 'rgb(34, 211, 238)';
      const t = Math.min(1, Math.max(0, (weight - minW) / (maxW - minW)));
      let r, g, b;
      if (t < 0.5) {
        const s = t * 2;
        r = Math.round(59 + (34 - 59) * s);
        g = Math.round(130 + (211 - 130) * s);
        b = Math.round(246 + (238 - 246) * s);
      } else {
        const s = (t - 0.5) * 2;
        r = Math.round(34 + (245 - 34) * s);
        g = Math.round(211 + (158 - 211) * s);
        b = Math.round(238 + (11 - 238) * s);
      }
      return `rgb(${r}, ${g}, ${b})`;
    };

    const minWeight = Math.min(...graphData.nodes.map(n => n.weight || 1));
    const maxWeight = Math.max(...graphData.nodes.map(n => n.weight || 1));
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}" style="background-color:#0b1021">`;
    
    graphData.links.forEach(l => {
      const sw = getScaledWeight(l.weight || 1);
      const strokeWidth = Math.max(0.5, sw * settings.linkMultiplier);
      const opacity = Math.min(0.7, 0.15 + (l.weight || 1) * 0.06);
      
      const source = typeof l.source === 'object' ? l.source : graphData.nodes.find(n => n.id === l.source);
      const target = typeof l.target === 'object' ? l.target : graphData.nodes.find(n => n.id === l.target);
      
      if (source && target && source.x != null && target.x != null) {
        svg += `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" stroke="rgba(120, 200, 255, ${opacity})" stroke-width="${strokeWidth}" />`;
      }
    });
    
    graphData.nodes.forEach(n => {
      if (n.x == null || n.y == null) return;
      const sw = getScaledWeight(n.weight || 1);
      const r = Math.max(3, sw * settings.nodeMultiplier);
      const color = weightToColor(n.weight || 1, minWeight, maxWeight);
      
      svg += `<circle cx="${n.x}" cy="${n.y}" r="${r}" fill="${color}" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />`;
      if (settings.showLabels) {
        svg += `<text x="${n.x}" y="${n.y}" font-family="Space Grotesk, sans-serif" font-size="${Math.max(11, 2.5)}" font-weight="600" fill="rgba(232,237,245,0.9)" text-anchor="middle" dominant-baseline="middle">${n.id}</text>`;
      }
    });
    
    svg += `</svg>`;
    
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'graph-visualization.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [graphData, settings]);

  const shortestPath = useMemo(() => {
    if (!graphData || !pathStart || !pathEnd || pathStart === pathEnd) return null;

    const graph = {};
    graphData.nodes.forEach(n => graph[n.id] = []);
    graphData.links.forEach(l => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      if (!graph[sourceId]) graph[sourceId] = [];
      if (!graph[targetId]) graph[targetId] = [];
      graph[sourceId].push({ to: targetId, weight: l.weight || 1 });
      graph[targetId].push({ to: sourceId, weight: l.weight || 1 }); // Undirected
    });

    const distances = {};
    const previous = {};
    const pq = new Set(graphData.nodes.map(n => n.id));

    graphData.nodes.forEach(n => {
      distances[n.id] = Infinity;
      previous[n.id] = null;
    });
    distances[pathStart] = 0;

    while (pq.size > 0) {
      let minNode = null;
      let minDistance = Infinity;
      for (const nodeId of pq) {
        if (distances[nodeId] < minDistance) {
          minDistance = distances[nodeId];
          minNode = nodeId;
        }
      }

      if (minNode === null || minNode === pathEnd) break;
      pq.delete(minNode);

      if (graph[minNode]) {
        for (const edge of graph[minNode]) {
          const alt = distances[minNode] + edge.weight;
          if (alt < distances[edge.to]) {
            distances[edge.to] = alt;
            previous[edge.to] = minNode;
          }
        }
      }
    }

    if (previous[pathEnd] === null) return { pathNodes: new Set(), pathLinks: new Set(), totalCost: null };

    const path = [];
    let curr = pathEnd;
    while (curr !== null) {
      path.unshift(curr);
      curr = previous[curr];
    }
    
    const pathLinks = new Set();
    for (let i = 0; i < path.length - 1; i++) {
      pathLinks.add(`${path[i]}->${path[i+1]}`);
    }

    return { pathNodes: new Set(path), pathLinks, totalCost: distances[pathEnd].toFixed(2) };
  }, [graphData, pathStart, pathEnd]);

  const handleReset = useCallback(() => {
    setGraphData(null);
    setHoverNode(null);
    setSelectedNode(null);
    setPathStart('');
    setPathEnd('');
  }, []);

  const augmentedSettings = { 
    ...settings, 
    hoverNode, setHoverNode, 
    hoverLink, setHoverLink, 
    selectedNode, setSelectedNode, 
    pathStart, setPathStart, 
    pathEnd, setPathEnd, 
    shortestPath 
  };

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
            settings={augmentedSettings}
            setFgRef={setFgRef}
          />
          <ControlPanel
            settings={augmentedSettings}
            setSettings={setSettings}
            onExport={handleExport}
            onExportSvg={handleExportSvg}
            onExportJson={handleExportJson}
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

          {/* Hover tooltip showing edge weight */}
          {hoverLink && !hoverNode && (
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
              <span style={{ color: 'var(--text-secondary)' }}>Edge</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 16 }}>
                {hoverLink.source.id ?? hoverLink.source} → {hoverLink.target.id ?? hoverLink.target}
              </span>
              <span style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Weight</span>
              <span style={{ fontWeight: 700, color: 'var(--highlight)', fontSize: 16 }}>
                {hoverLink.weight ?? '—'}
              </span>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default App;
