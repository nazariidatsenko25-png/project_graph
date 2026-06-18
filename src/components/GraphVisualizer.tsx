'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useGraphStore } from '../store/useGraphStore';
import { findShortestPath } from '../utils/pathfinding';

// ForceGraph2D requires `window` and fails on SSR.
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
});

/**
 * Maps a weight value to a color on the blue → cyan → amber gradient.
 */
const weightToColor = (weight: number, minW: number, maxW: number): [number, number, number] => {
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

export default function GraphVisualizer({ setFgRef }: { setFgRef?: (ref: any) => void }) {
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const {
    graphData,
    settings,
    hoverNode,
    selectedNode,
    pathStart,
    pathEnd,
    setHoverNode,
    setHoverLink,
    setSelectedNode,
  } = useGraphStore();

  useEffect(() => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (setFgRef) setFgRef(fgRef);
  }, [fgRef, setFgRef]);

  const { minWeight, maxWeight } = useMemo(() => {
    if (!graphData || !graphData.nodes.length) return { minWeight: 1, maxWeight: 1 };
    const weights = graphData.nodes.map((n) => n.weight || 1);
    return { minWeight: Math.min(...weights), maxWeight: Math.max(...weights) };
  }, [graphData]);

  const shortestPath = useMemo(() => {
    if (graphData && pathStart && pathEnd) {
      return findShortestPath(graphData, pathStart, pathEnd);
    }
    return null;
  }, [graphData, pathStart, pathEnd]);

  const hasPath = shortestPath && shortestPath.pathNodes && shortestPath.pathNodes.size > 0;

  const focusNeighbors = useMemo(() => {
    if (!selectedNode || !graphData) return new Set<string>();
    const neighbors = new Set<string>();
    graphData.links.forEach(l => {
      const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      if (sourceId === selectedNode) neighbors.add(targetId);
      if (targetId === selectedNode) neighbors.add(sourceId);
    });
    return neighbors;
  }, [selectedNode, graphData]);

  const isFaded = useCallback((nodeId: string) => {
    if (hasPath) return !shortestPath?.pathNodes.has(nodeId);
    if (!selectedNode) return false;
    return nodeId !== selectedNode && !focusNeighbors.has(nodeId);
  }, [selectedNode, focusNeighbors, hasPath, shortestPath]);

  const isLinkFaded = useCallback((link: any) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    if (hasPath) {
      return !shortestPath?.pathLinks.has(`${sourceId}->${targetId}`) && 
             !shortestPath?.pathLinks.has(`${targetId}->${sourceId}`);
    }
    if (!selectedNode) return false;
    return sourceId !== selectedNode && targetId !== selectedNode;
  }, [selectedNode, hasPath, shortestPath]);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge')?.strength(settings.charge);
      fgRef.current.d3Force('link')?.distance(settings.linkDistance);
      fgRef.current.d3ReheatSimulation();
    }
  }, [settings.charge, settings.linkDistance]);

  // Zoom to fit on first load
  useEffect(() => {
    if (fgRef.current && graphData) {
      const timer = setTimeout(() => {
        fgRef.current?.zoomToFit?.(600, 80);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [graphData]);

  const getScaledWeight = useCallback((weight: number) => {
    if (settings.scalingMode === 'log') return Math.max(0.1, Math.log10(weight + 1));
    if (settings.scalingMode === 'sqrt') return Math.max(0.1, Math.sqrt(weight));
    return weight;
  }, [settings.scalingMode]);

  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      // Guard against missing coordinates during initialization
      if (node.x == null || node.y == null || isNaN(node.x) || isNaN(node.y)) return;

      const weight = node.weight || 1;
      const scaledWeight = getScaledWeight(weight);
      const radius = Math.max(3, scaledWeight * settings.nodeMultiplier);
      const isHovered = node.id === hoverNode;
      const isSelected = node.id === selectedNode;
      const isPathNode = hasPath && shortestPath?.pathNodes.has(node.id);

      let [r, g, b] = weightToColor(weight, minWeight, maxWeight);
      if (isPathNode) {
        [r, g, b] = [252, 211, 77]; // Amber highlight for path
      }

      const faded = isFaded(node.id);
      const opacity = faded ? 0.15 : 1;
      const glowOpacity = isPathNode ? 0.4 : (faded ? 0.05 : 0.25);

      // Outer glow — constellation effect
      const glowRadius = radius * 2.5;
      const gradient = ctx.createRadialGradient(
        node.x, node.y, radius * 0.3,
        node.x, node.y, glowRadius
      );
      gradient.addColorStop(0, `rgba(${r},${g},${b},${glowOpacity})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
      ctx.fill();

      // Subtle border
      ctx.lineWidth = 0.5 / globalScale;
      ctx.strokeStyle = `rgba(255,255,255,${faded ? 0.05 : 0.3})`;
      ctx.stroke();

      // Highlight rings
      if (isHovered || isSelected || isPathNode) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4 / globalScale, 0, 2 * Math.PI);
        ctx.strokeStyle = (isSelected || isPathNode) ? `rgba(${r},${g},${b},0.8)` : '#ffffff';
        ctx.lineWidth = ((isSelected || isPathNode) ? 4 : 2) / globalScale;
        ctx.stroke();
      }

      // Label
      const labelThreshold = settings.showLabels ? 0.3 : 2.5;
      if (globalScale > labelThreshold || radius > 12) {
        const fontSize = Math.max(11 / globalScale, 2.5);
        ctx.font = `600 ${fontSize}px 'Space Grotesk', 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = (isHovered || node.id === selectedNode) ? '#ffffff' : `rgba(232,237,245,${faded ? 0.2 : 0.9})`;
        const labelY = radius < 8 / globalScale ? node.y + radius + fontSize : node.y;
        ctx.fillText(node.id, node.x, labelY);
      }
    },
    [settings.nodeMultiplier, hoverNode, settings.showLabels, minWeight, maxWeight, getScaledWeight, isFaded, selectedNode, hasPath, shortestPath]
  );

  const getLinkWidth = useCallback(
    (link: any) => Math.max(0.5, getScaledWeight(link.weight || 1) * settings.linkMultiplier),
    [settings.linkMultiplier, getScaledWeight]
  );

  const getLinkColor = useCallback(
    (link: any) => {
      const weight = link.weight || 1;
      let opacity = Math.min(0.7, 0.15 + weight * 0.06);
      
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      const isPathLink = hasPath && (
        shortestPath?.pathLinks.has(`${sourceId}->${targetId}`) || 
        shortestPath?.pathLinks.has(`${targetId}->${sourceId}`)
      );

      if (isLinkFaded(link)) {
        opacity = 0.05;
      } else if (isPathLink) {
        return `rgba(252, 211, 77, 0.9)`; // Amber highlight for path links
      } else if (selectedNode) {
        opacity = Math.min(0.9, opacity + 0.3); // Highlight active links
      }
      return `rgba(120, 200, 255, ${opacity})`;
    },
    [isLinkFaded, selectedNode, hasPath, shortestPath]
  );

  if (dimensions.width === 0) return null;

  return (
    <div className="absolute inset-0 bg-transparent z-0">
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData!}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          if (node.x == null || node.y == null) return;
          const r = Math.max(5, getScaledWeight(node.weight || 1) * settings.nodeMultiplier + 4);
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkWidth={getLinkWidth}
        linkColor={getLinkColor}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkDirectionalParticles={(link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          
          if (hasPath && (shortestPath?.pathLinks.has(`${sourceId}->${targetId}`) || shortestPath?.pathLinks.has(`${targetId}->${sourceId}`))) {
            return 4; // Path particles
          }
          if (selectedNode && (sourceId === selectedNode || targetId === selectedNode)) {
            return 2; // Selection particles
          }
          return 0; // No particles otherwise
        }}
        linkDirectionalParticleSpeed={(link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          if (hasPath && (shortestPath?.pathLinks.has(`${sourceId}->${targetId}`) || shortestPath?.pathLinks.has(`${targetId}->${sourceId}`))) {
            return 0.015; // Fast speed for path
          }
          return 0.005; // Normal speed
        }}
        linkDirectionalParticleWidth={(link: any) => Math.max(1.5, getScaledWeight(link.weight || 1) * settings.linkMultiplier)}
        linkDirectionalParticleColor={() => '#fcd34d'}
        onNodeHover={(node: any) => setHoverNode(node ? String(node.id) : null)}
        onLinkHover={(link) => setHoverLink(link as any)}
        onNodeClick={(node: any) => setSelectedNode(node ? (selectedNode === String(node.id) ? null : String(node.id)) : null)}
        onBackgroundClick={() => setSelectedNode(null)}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        cooldownTime={3000}
        warmupTicks={50}
      />
    </div>
  );
}
