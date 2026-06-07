import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

/**
 * Maps a weight value to a color on the blue → cyan → amber gradient.
 */
const weightToColor = (weight, minW, maxW) => {
  if (maxW === minW) return [34, 211, 238]; // cyan fallback
  const t = Math.min(1, Math.max(0, (weight - minW) / (maxW - minW)));

  if (t < 0.5) {
    const s = t * 2;
    return [
      Math.round(59 + (34 - 59) * s),
      Math.round(130 + (211 - 130) * s),
      Math.round(246 + (238 - 246) * s),
    ];
  } else {
    const s = (t - 0.5) * 2;
    return [
      Math.round(34 + (245 - 34) * s),
      Math.round(211 + (158 - 211) * s),
      Math.round(238 + (11 - 238) * s),
    ];
  }
};

const GraphVisualizer = ({ data, settings, setFgRef }) => {
  const fgRef = useRef();
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const { minWeight, maxWeight } = useMemo(() => {
    if (!data || !data.nodes.length) return { minWeight: 1, maxWeight: 1 };
    const weights = data.nodes.map((n) => n.weight || 1);
    return { minWeight: Math.min(...weights), maxWeight: Math.max(...weights) };
  }, [data]);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (setFgRef) setFgRef(fgRef);
  }, [fgRef, setFgRef]);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(settings.charge);
      fgRef.current.d3Force('link').distance(settings.linkDistance);
      fgRef.current.d3ReheatSimulation();
    }
  }, [settings.charge, settings.linkDistance]);

  // Zoom to fit on first load
  useEffect(() => {
    if (fgRef.current && data) {
      setTimeout(() => {
        fgRef.current.zoomToFit(600, 80);
      }, 800);
    }
  }, [data]);

  const paintNode = useCallback(
    (node, ctx, globalScale) => {
      // Guard against missing coordinates during initialization
      if (node.x == null || node.y == null || isNaN(node.x) || isNaN(node.y)) return;

      const weight = node.weight || 1;
      const radius = Math.max(3, weight * settings.nodeMultiplier);
      const isHovered = node.id === settings.hoverNode;
      const [r, g, b] = weightToColor(weight, minWeight, maxWeight);

      // Outer glow — constellation effect
      const glowRadius = radius * 2.5;
      const gradient = ctx.createRadialGradient(
        node.x, node.y, radius * 0.3,
        node.x, node.y, glowRadius
      );
      gradient.addColorStop(0, `rgba(${r},${g},${b},0.25)`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fill();

      // Subtle border
      ctx.lineWidth = 0.5 / globalScale;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.stroke();

      // Hover ring
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4 / globalScale, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

      // Label
      const labelThreshold = settings.showLabels ? 0.3 : 2.5;
      if (globalScale > labelThreshold || radius > 12) {
        const fontSize = Math.max(11 / globalScale, 2.5);
        ctx.font = `600 ${fontSize}px 'Space Grotesk', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isHovered ? '#ffffff' : 'rgba(232,237,245,0.9)';
        const labelY = radius < 8 / globalScale ? node.y + radius + fontSize : node.y;
        ctx.fillText(node.id, node.x, labelY);
      }
    },
    [settings.nodeMultiplier, settings.hoverNode, settings.showLabels, minWeight, maxWeight]
  );

  // Use built-in linkWidth + linkColor instead of custom linkCanvasObject
  // to avoid crashes from accessing uninitialized source/target coordinates
  const getLinkWidth = useCallback(
    (link) => Math.max(0.5, (link.weight || 1) * settings.linkMultiplier),
    [settings.linkMultiplier]
  );

  const getLinkColor = useCallback(
    (link) => {
      const weight = link.weight || 1;
      const opacity = Math.min(0.7, 0.15 + weight * 0.06);
      return `rgba(120, 200, 255, ${opacity})`;
    },
    []
  );

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-deep)' }}>
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={(node, color, ctx) => {
          if (node.x == null || node.y == null) return;
          const r = Math.max(5, (node.weight || 1) * settings.nodeMultiplier + 4);
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkWidth={getLinkWidth}
        linkColor={getLinkColor}
        onNodeHover={(node) => settings.setHoverNode(node ? node.id : null)}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        cooldownTime={3000}
        warmupTicks={50}
      />
    </div>
  );
};

export default GraphVisualizer;
