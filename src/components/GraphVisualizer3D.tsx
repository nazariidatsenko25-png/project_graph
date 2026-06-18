'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useGraphStore } from '../store/useGraphStore';
import { findShortestPath } from '../utils/pathfinding';
import SpriteText from 'three-spritetext';

// ForceGraph3D requires `window` and fails on SSR.
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
});

/**
 * Maps a weight value to a hex color on the blue → cyan → amber gradient for 3D.
 */
const weightToHexColor = (weight: number, minW: number, maxW: number): string => {
  if (maxW === minW) return '#22d3ee'; // cyan fallback
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
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
};

export default function GraphVisualizer3D({ setFgRef }: { setFgRef?: (ref: any) => void }) {
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

  const getScaledWeight = useCallback((weight: number) => {
    if (settings.scalingMode === 'log') return Math.max(0.1, Math.log10(weight + 1));
    if (settings.scalingMode === 'sqrt') return Math.max(0.1, Math.sqrt(weight));
    return weight;
  }, [settings.scalingMode]);

  // Color functions
  const getNodeColor = useCallback((node: any) => {
    const isPathNode = hasPath && shortestPath?.pathNodes.has(node.id);
    const isSelected = node.id === selectedNode;
    const isHovered = node.id === hoverNode;
    
    if (isPathNode || isSelected || isHovered) return '#fcd34d'; // Amber for highlights
    if (isFaded(node.id)) return 'rgba(100,100,100,0.1)';
    
    return weightToHexColor(node.weight || 1, minWeight, maxWeight);
  }, [hasPath, shortestPath, selectedNode, hoverNode, isFaded, minWeight, maxWeight]);

  const getLinkColor = useCallback((link: any) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    const isPathLink = hasPath && (
      shortestPath?.pathLinks.has(`${sourceId}->${targetId}`) || 
      shortestPath?.pathLinks.has(`${targetId}->${sourceId}`)
    );

    if (isPathLink) return '#fcd34d';
    if (isLinkFaded(link)) return 'rgba(100,100,100,0.05)';
    
    if (selectedNode && (sourceId === selectedNode || targetId === selectedNode)) {
      return '#38bdf8'; // bright blue highlight for active node's links
    }
    
    return 'rgba(120, 200, 255, 0.4)';
  }, [hasPath, shortestPath, isLinkFaded, selectedNode]);

  if (dimensions.width === 0) return null;

  return (
    <div className="absolute inset-0 bg-transparent z-0">
      <ForceGraph3D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        graphData={graphData!}
        nodeVal={(node: any) => getScaledWeight(node.weight || 1) * settings.nodeMultiplier}
        nodeResolution={32}
        nodeColor={getNodeColor}
        nodeOpacity={0.8}
        nodeThreeObjectExtend={true}
        nodeThreeObject={settings.showLabels ? ((node: any) => {
          const sprite = new SpriteText(node.id);
          sprite.color = 'rgba(255, 255, 255, 0.9)';
          sprite.textHeight = 4;
          sprite.fontWeight = 'bold';
          sprite.backgroundColor = 'rgba(0,0,0,0.4)';
          sprite.padding = 2;
          sprite.borderRadius = 4;
          
          const val = getScaledWeight(node.weight || 1) * settings.nodeMultiplier;
          const radius = Math.cbrt(val) * 4;
          sprite.position.y = radius + 3;
          return sprite as any;
        }) : undefined}
        linkWidth={(link: any) => Math.max(0.2, getScaledWeight(link.weight || 1) * settings.linkMultiplier * 0.5)}
        linkColor={getLinkColor}
        linkResolution={12}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkDirectionalParticles={(link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          
          if (hasPath && (shortestPath?.pathLinks.has(`${sourceId}->${targetId}`) || shortestPath?.pathLinks.has(`${targetId}->${sourceId}`))) {
            return 4;
          }
          if (selectedNode && (sourceId === selectedNode || targetId === selectedNode)) {
            return 2;
          }
          return 0;
        }}
        linkDirectionalParticleSpeed={(link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          if (hasPath && (shortestPath?.pathLinks.has(`${sourceId}->${targetId}`) || shortestPath?.pathLinks.has(`${targetId}->${sourceId}`))) {
            return 0.015;
          }
          return 0.005;
        }}
        linkDirectionalParticleWidth={(link: any) => Math.max(0.5, getScaledWeight(link.weight || 1) * settings.linkMultiplier * 0.8)}
        linkDirectionalParticleColor={() => '#fcd34d'}
        onNodeHover={(node: any) => setHoverNode(node ? String(node.id) : null)}
        onLinkHover={(link) => setHoverLink(link as any)}
        onNodeClick={(node: any) => setSelectedNode(node ? (selectedNode === String(node.id) ? null : String(node.id)) : null)}
        onBackgroundClick={() => setSelectedNode(null)}
        cooldownTime={3000}
        warmupTicks={50}
      />
    </div>
  );
}
