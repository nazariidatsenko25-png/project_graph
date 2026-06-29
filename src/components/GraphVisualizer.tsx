'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import { useGraphStore } from '../store/useGraphStore';
import { findShortestPath } from '../utils/pathfinding';
import {
  weightToRgb,
  getScaledWeight,
  getWeightRange,
  buildFocusNeighbors,
  isNodeFaded,
  isLinkFaded,
  isPathLink,
  resolveId,
} from '../utils/graphHelpers';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function GraphVisualizer({ setFgRef }: { setFgRef?: (ref: React.RefObject<ForceGraphMethods | undefined>) => void }) {
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const {
    graphData,
    settings,
    hoverNode,
    selectedNode,
    pathStart,
    pathEnd,
    isDirected,
    setHoverNode,
    setHoverLink,
    setSelectedNode,
  } = useGraphStore();

  useEffect(() => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
    const onResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (setFgRef) setFgRef(fgRef as React.RefObject<ForceGraphMethods | undefined>);
  }, [fgRef, setFgRef]);

  const { minWeight, maxWeight } = useMemo(() => getWeightRange(graphData), [graphData]);

  const shortestPath = useMemo(
    () => (graphData && pathStart && pathEnd ? findShortestPath(graphData, pathStart, pathEnd, isDirected) : null),
    [graphData, pathStart, pathEnd, isDirected],
  );

  const hasPath = Boolean(shortestPath?.pathNodes && shortestPath.pathNodes.size > 0);

  const focusNeighbors = useMemo(
    () => buildFocusNeighbors(graphData, selectedNode),
    [selectedNode, graphData],
  );

  const checkNodeFaded = useCallback(
    (nodeId: string) => isNodeFaded(nodeId, selectedNode, focusNeighbors, hasPath, shortestPath?.pathNodes),
    [selectedNode, focusNeighbors, hasPath, shortestPath],
  );

  const checkLinkFaded = useCallback(
    (link: { source: string | { id: string }; target: string | { id: string } }) => {
      const srcId = resolveId(link.source as string | { id: string });
      const tgtId = resolveId(link.target as string | { id: string });
      return isLinkFaded(srcId, tgtId, selectedNode, hasPath, shortestPath?.pathLinks);
    },
    [selectedNode, hasPath, shortestPath],
  );

  // Sync physics params
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
      const t = setTimeout(() => fgRef.current?.zoomToFit(600, 80), 800);
      return () => clearTimeout(t);
    }
  }, [graphData]);

  const getWeight = useCallback(
    (weight: number) => getScaledWeight(weight, settings.scalingMode),
    [settings.scalingMode],
  );

  const paintNode = useCallback(
    (node: { id: string; weight?: number; x?: number; y?: number }, ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (node.x == null || node.y == null || isNaN(node.x) || isNaN(node.y)) return;

      const weight = node.weight || 1;
      const scaledWeight = getWeight(weight);
      const radius = Math.max(3, scaledWeight * settings.nodeMultiplier);
      const isHovered = node.id === hoverNode;
      const isSelected = node.id === selectedNode;
      const isOnPath = hasPath && shortestPath?.pathNodes.has(node.id);

      let [r, g, b] = weightToRgb(weight, minWeight, maxWeight);
      if (isOnPath) [r, g, b] = [252, 211, 77];

      const faded = checkNodeFaded(node.id);
      const opacity = faded ? 0.15 : 1;
      const glowOpacity = isOnPath ? 0.4 : faded ? 0.05 : 0.25;

      // Outer glow
      const glowRadius = radius * 2.5;
      const gradient = ctx.createRadialGradient(node.x, node.y, radius * 0.3, node.x, node.y, glowRadius);
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

      // Border
      ctx.lineWidth = 0.5 / globalScale;
      ctx.strokeStyle = `rgba(255,255,255,${faded ? 0.05 : 0.3})`;
      ctx.stroke();

      // Highlight rings (hovered, selected, path)
      if (isHovered || isSelected || isOnPath) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4 / globalScale, 0, 2 * Math.PI);
        ctx.strokeStyle = isSelected || isOnPath ? `rgba(${r},${g},${b},0.8)` : '#ffffff';
        ctx.lineWidth = ((isSelected || isOnPath) ? 4 : 2) / globalScale;
        ctx.stroke();
      }

      // Label
      const labelThreshold = settings.showLabels ? 0.3 : 2.5;
      if (globalScale > labelThreshold || radius > 12) {
        const fontSize = Math.max(11 / globalScale, 2.5);
        ctx.font = `600 ${fontSize}px 'Fira Code', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle =
          isHovered || isSelected ? '#ffffff' : `rgba(232,237,245,${faded ? 0.2 : 0.9})`;
        const labelY = radius < 8 / globalScale ? node.y + radius + fontSize : node.y;
        ctx.fillText(node.id, node.x, labelY);
      }
    },
    [settings.nodeMultiplier, settings.showLabels, hoverNode, selectedNode, minWeight, maxWeight, getWeight, checkNodeFaded, hasPath, shortestPath],
  );

  const getLinkWidth = useCallback(
    (link: { weight?: number }) => Math.max(0.5, getWeight(link.weight || 1) * settings.linkMultiplier),
    [settings.linkMultiplier, getWeight],
  );

  const getLinkColor = useCallback(
    (link: { source: string | { id: string }; target: string | { id: string }; weight?: number }) => {
      const srcId = resolveId(link.source as string | { id: string });
      const tgtId = resolveId(link.target as string | { id: string });

      if (checkLinkFaded(link)) return 'rgba(120,200,255,0.05)';
      if (isPathLink(srcId, tgtId, hasPath, shortestPath?.pathLinks)) return 'rgba(252,211,77,0.9)';
      if (selectedNode) {
        const weight = link.weight || 1;
        return `rgba(120,200,255,${Math.min(0.9, 0.15 + weight * 0.06 + 0.3)})`;
      }
      const weight = link.weight || 1;
      return `rgba(120,200,255,${Math.min(0.7, 0.15 + weight * 0.06)})`;
    },
    [checkLinkFaded, selectedNode, hasPath, shortestPath],
  );

  const getParticleCount = useCallback(
    (link: { source: string | { id: string }; target: string | { id: string } }) => {
      const srcId = resolveId(link.source as string | { id: string });
      const tgtId = resolveId(link.target as string | { id: string });
      if (isPathLink(srcId, tgtId, hasPath, shortestPath?.pathLinks)) return 4;
      if (selectedNode && (srcId === selectedNode || tgtId === selectedNode)) return 2;
      return 0;
    },
    [hasPath, shortestPath, selectedNode],
  );

  const getParticleSpeed = useCallback(
    (link: { source: string | { id: string }; target: string | { id: string } }) => {
      const srcId = resolveId(link.source as string | { id: string });
      const tgtId = resolveId(link.target as string | { id: string });
      return isPathLink(srcId, tgtId, hasPath, shortestPath?.pathLinks) ? 0.015 : 0.005;
    },
    [hasPath, shortestPath],
  );

  if (dimensions.width === 0) return null;

  return (
    <div className="absolute inset-0 bg-transparent z-0">
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData!}
        nodeCanvasObject={paintNode as (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => void}
        nodePointerAreaPaint={(node: object, color: string, ctx: CanvasRenderingContext2D) => {
          const n = node as { x?: number; y?: number; weight?: number };
          if (n.x == null || n.y == null) return;
          const r = Math.max(5, getWeight(n.weight || 1) * settings.nodeMultiplier + 4);
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkWidth={getLinkWidth as (link: object) => number}
        linkColor={getLinkColor as (link: object) => string}
        linkDirectionalArrowLength={isDirected ? 4 : 0}
        linkDirectionalArrowRelPos={1}
        linkDirectionalParticles={getParticleCount as (link: object) => number}
        linkDirectionalParticleSpeed={getParticleSpeed as (link: object) => number}
        linkDirectionalParticleWidth={(link: object) => {
          const l = link as { weight?: number };
          return Math.max(1.5, getWeight(l.weight || 1) * settings.linkMultiplier);
        }}
        linkDirectionalParticleColor={() => '#fcd34d'}
        onNodeHover={(node) => setHoverNode(node ? String((node as { id: string }).id) : null)}
        onLinkHover={(link) => setHoverLink(link as Parameters<typeof setHoverLink>[0])}
        onNodeClick={(node) =>
          setSelectedNode(
            node
              ? selectedNode === String((node as { id: string }).id)
                ? null
                : String((node as { id: string }).id)
              : null,
          )
        }
        onBackgroundClick={() => setSelectedNode(null)}
        enableZoomInteraction
        enablePanInteraction
        cooldownTime={3000}
        warmupTicks={50}
      />
    </div>
  );
}
