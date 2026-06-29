'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { ForceGraphMethods } from 'react-force-graph-3d';
import { useGraphStore } from '../store/useGraphStore';
import { findShortestPath } from '../utils/pathfinding';
import {
  weightToHex,
  getScaledWeight,
  getWeightRange,
  buildFocusNeighbors,
  isNodeFaded,
  isLinkFaded,
  isPathLink,
  resolveId,
} from '../utils/graphHelpers';
import SpriteText from 'three-spritetext';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

export default function GraphVisualizer3D({ setFgRef }: { setFgRef?: (ref: React.RefObject<ForceGraphMethods | undefined>) => void }) {
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

  // Sync physics
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge')?.strength(settings.charge);
      fgRef.current.d3Force('link')?.distance(settings.linkDistance);
      fgRef.current.d3ReheatSimulation();
    }
  }, [settings.charge, settings.linkDistance]);

  const getWeight = useCallback(
    (weight: number) => getScaledWeight(weight, settings.scalingMode),
    [settings.scalingMode],
  );

  const getNodeColor = useCallback(
    (node: object) => {
      const n = node as { id: string; weight?: number };
      const isOnPath = hasPath && shortestPath?.pathNodes.has(n.id);
      const isSelected = n.id === selectedNode;
      const isHovered = n.id === hoverNode;

      if (isOnPath || isSelected || isHovered) return '#fcd34d';
      if (isNodeFaded(n.id, selectedNode, focusNeighbors, hasPath, shortestPath?.pathNodes)) {
        return 'rgba(100,100,100,0.1)';
      }
      return weightToHex(n.weight || 1, minWeight, maxWeight);
    },
    [hasPath, shortestPath, selectedNode, hoverNode, focusNeighbors, minWeight, maxWeight],
  );

  const getLinkColor = useCallback(
    (link: object) => {
      const l = link as { source: string | { id: string }; target: string | { id: string } };
      const srcId = resolveId(l.source);
      const tgtId = resolveId(l.target);

      if (isPathLink(srcId, tgtId, hasPath, shortestPath?.pathLinks)) return '#fcd34d';
      if (isLinkFaded(srcId, tgtId, selectedNode, hasPath, shortestPath?.pathLinks)) {
        return 'rgba(100,100,100,0.05)';
      }
      if (selectedNode && (srcId === selectedNode || tgtId === selectedNode)) return '#38bdf8';
      return 'rgba(120,200,255,0.4)';
    },
    [hasPath, shortestPath, selectedNode],
  );

  const getParticleCount = useCallback(
    (link: object) => {
      const l = link as { source: string | { id: string }; target: string | { id: string } };
      const srcId = resolveId(l.source);
      const tgtId = resolveId(l.target);
      if (isPathLink(srcId, tgtId, hasPath, shortestPath?.pathLinks)) return 4;
      if (selectedNode && (srcId === selectedNode || tgtId === selectedNode)) return 2;
      return 0;
    },
    [hasPath, shortestPath, selectedNode],
  );

  const getParticleSpeed = useCallback(
    (link: object) => {
      const l = link as { source: string | { id: string }; target: string | { id: string } };
      const srcId = resolveId(l.source);
      const tgtId = resolveId(l.target);
      return isPathLink(srcId, tgtId, hasPath, shortestPath?.pathLinks) ? 0.015 : 0.005;
    },
    [hasPath, shortestPath],
  );

  const buildNodeLabel = useCallback(
    (node: object) => {
      const n = node as { id: string; weight?: number };
      const sprite = new SpriteText(n.id);
      sprite.color = 'rgba(255,255,255,0.9)';
      sprite.textHeight = 4;
      sprite.fontWeight = 'bold';
      sprite.backgroundColor = 'rgba(0,0,0,0.4)';
      sprite.padding = 2;
      sprite.borderRadius = 4;
      const val = getWeight(n.weight || 1) * settings.nodeMultiplier;
      const radius = Math.cbrt(val) * 4;
      sprite.position.y = radius + 3;
      return sprite;
    },
    [settings.showLabels, settings.nodeMultiplier, getWeight],
  );

  if (dimensions.width === 0) return null;

  return (
    <div className="absolute inset-0 bg-transparent z-0">
      <ForceGraph3D
        ref={fgRef as React.RefObject<ForceGraphMethods | undefined>}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        graphData={graphData!}
        nodeVal={(node: object) => {
          const n = node as { weight?: number };
          return getWeight(n.weight || 1) * settings.nodeMultiplier;
        }}
        nodeResolution={32}
        nodeColor={getNodeColor}
        nodeOpacity={0.8}
        nodeThreeObjectExtend
        nodeThreeObject={settings.showLabels ? buildNodeLabel : undefined}
        linkWidth={(link: object) => {
          const l = link as { weight?: number };
          return Math.max(0.2, getWeight(l.weight || 1) * settings.linkMultiplier * 0.5);
        }}
        linkColor={getLinkColor}
        linkResolution={12}
        linkDirectionalArrowLength={isDirected ? 4 : 0}
        linkDirectionalArrowRelPos={1}
        linkDirectionalParticles={getParticleCount}
        linkDirectionalParticleSpeed={getParticleSpeed}
        linkDirectionalParticleWidth={(link: object) => {
          const l = link as { weight?: number };
          return Math.max(0.5, getWeight(l.weight || 1) * settings.linkMultiplier * 0.8);
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
        cooldownTime={3000}
        warmupTicks={50}
      />
    </div>
  );
}
