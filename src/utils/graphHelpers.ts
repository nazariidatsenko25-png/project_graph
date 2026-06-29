import type { GraphData, GraphSettings, ScalingMode } from '../store/useGraphStore';
import { findShortestPath } from './pathfinding';

// ---------------------------------------------------------------------------
// Color mapping
// ---------------------------------------------------------------------------

/**
 * Maps a node weight to an RGB triplet on the blue → cyan → amber gradient.
 * Used by the 2D canvas renderer.
 */
export function weightToRgb(
  weight: number,
  minW: number,
  maxW: number,
): [number, number, number] {
  if (maxW === minW) return [34, 211, 238]; // cyan fallback

  const t = Math.min(1, Math.max(0, (weight - minW) / (maxW - minW)));

  if (t < 0.5) {
    const s = t * 2;
    return [
      Math.round(59 + (34 - 59) * s),
      Math.round(130 + (211 - 130) * s),
      Math.round(246 + (238 - 246) * s),
    ];
  }

  const s = (t - 0.5) * 2;
  return [
    Math.round(34 + (245 - 34) * s),
    Math.round(211 + (158 - 211) * s),
    Math.round(238 + (11 - 238) * s),
  ];
}

/**
 * Maps a node weight to a CSS hex color on the blue → cyan → amber gradient.
 * Used by the 3D renderer and SVG export.
 */
export function weightToHex(weight: number, minW: number, maxW: number): string {
  const [r, g, b] = weightToRgb(weight, minW, maxW);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/**
 * Maps a node weight to a CSS `rgb(...)` string.
 * Used by the SVG export.
 */
export function weightToRgbStr(weight: number, minW: number, maxW: number): string {
  const [r, g, b] = weightToRgb(weight, minW, maxW);
  return `rgb(${r}, ${g}, ${b})`;
}

// ---------------------------------------------------------------------------
// Weight scaling
// ---------------------------------------------------------------------------

export function getScaledWeight(weight: number, mode: ScalingMode): number {
  if (mode === 'log') return Math.max(0.1, Math.log10(weight + 1));
  if (mode === 'sqrt') return Math.max(0.1, Math.sqrt(weight));
  return weight;
}

// ---------------------------------------------------------------------------
// Weight statistics
// ---------------------------------------------------------------------------

export function getWeightRange(graphData: GraphData | null): { minWeight: number; maxWeight: number } {
  if (!graphData || graphData.nodes.length === 0) return { minWeight: 1, maxWeight: 1 };
  const weights = graphData.nodes.map((n) => n.weight || 1);
  return { minWeight: Math.min(...weights), maxWeight: Math.max(...weights) };
}

// ---------------------------------------------------------------------------
// Graph ID resolution helpers
// ---------------------------------------------------------------------------

export function resolveId(endpoint: string | { id: string }): string {
  return typeof endpoint === 'object' ? endpoint.id : endpoint;
}

// ---------------------------------------------------------------------------
// Focus / fading helpers
// ---------------------------------------------------------------------------

export function buildFocusNeighbors(
  graphData: GraphData | null,
  selectedNode: string | null,
): Set<string> {
  if (!selectedNode || !graphData) return new Set<string>();
  const neighbors = new Set<string>();
  graphData.links.forEach((l) => {
    const srcId = resolveId(l.source as string | { id: string });
    const tgtId = resolveId(l.target as string | { id: string });
    if (srcId === selectedNode) neighbors.add(tgtId);
    if (tgtId === selectedNode) neighbors.add(srcId);
  });
  return neighbors;
}

export function buildShortestPathSets(
  graphData: GraphData | null,
  pathStart: string,
  pathEnd: string,
) {
  if (!graphData || !pathStart || !pathEnd) return null;
  return findShortestPath(graphData, pathStart, pathEnd);
}

export function isNodeFaded(
  nodeId: string,
  selectedNode: string | null,
  focusNeighbors: Set<string>,
  hasPath: boolean,
  pathNodes: Set<string> | undefined,
): boolean {
  if (hasPath && pathNodes) return !pathNodes.has(nodeId);
  if (!selectedNode) return false;
  return nodeId !== selectedNode && !focusNeighbors.has(nodeId);
}

export function isLinkFaded(
  srcId: string,
  tgtId: string,
  selectedNode: string | null,
  hasPath: boolean,
  pathLinks: Set<string> | undefined,
): boolean {
  if (hasPath && pathLinks) {
    return !pathLinks.has(`${srcId}->${tgtId}`) && !pathLinks.has(`${tgtId}->${srcId}`);
  }
  if (!selectedNode) return false;
  return srcId !== selectedNode && tgtId !== selectedNode;
}

export function isPathLink(
  srcId: string,
  tgtId: string,
  hasPath: boolean,
  pathLinks: Set<string> | undefined,
): boolean {
  if (!hasPath || !pathLinks) return false;
  return pathLinks.has(`${srcId}->${tgtId}`) || pathLinks.has(`${tgtId}->${srcId}`);
}

// ---------------------------------------------------------------------------
// SVG export helper (was duplicated in export.ts)
// ---------------------------------------------------------------------------

export function buildSvgExport(graphData: GraphData, settings: GraphSettings): string {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  graphData.nodes.forEach((n) => {
    if (n.x !== undefined && n.x < minX) minX = n.x;
    if (n.y !== undefined && n.y < minY) minY = n.y;
    if (n.x !== undefined && n.x > maxX) maxX = n.x;
    if (n.y !== undefined && n.y > maxY) maxY = n.y;
  });

  const padding = 100;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;
  const viewBox = `${minX - padding} ${minY - padding} ${width} ${height}`;

  const nodeWeights = graphData.nodes.map((n) => n.weight || 1);
  const minWeight = Math.min(...nodeWeights);
  const maxWeight = Math.max(...nodeWeights);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}" style="background-color:#0b1021">`;

  graphData.links.forEach((l) => {
    const sw = getScaledWeight(l.weight || 1, settings.scalingMode);
    const strokeWidth = Math.max(0.5, sw * settings.linkMultiplier);
    const opacity = Math.min(0.7, 0.15 + (l.weight || 1) * 0.06);

    const source = typeof l.source === 'object' ? l.source : graphData.nodes.find((n) => n.id === l.source);
    const target = typeof l.target === 'object' ? l.target : graphData.nodes.find((n) => n.id === l.target);

    if (source && target && source.x != null && target.x != null) {
      svg += `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" stroke="rgba(120,200,255,${opacity})" stroke-width="${strokeWidth}" />`;
    }
  });

  graphData.nodes.forEach((n) => {
    if (n.x == null || n.y == null) return;
    const sw = getScaledWeight(n.weight || 1, settings.scalingMode);
    const r = Math.max(3, sw * settings.nodeMultiplier);
    const color = weightToRgbStr(n.weight || 1, minWeight, maxWeight);

    svg += `<circle cx="${n.x}" cy="${n.y}" r="${r}" fill="${color}" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />`;
    if (settings.showLabels) {
      svg += `<text x="${n.x}" y="${n.y}" font-family="Fira Code, monospace" font-size="11" font-weight="600" fill="rgba(232,237,245,0.9)" text-anchor="middle" dominant-baseline="middle">${n.id}</text>`;
    }
  });

  svg += `</svg>`;
  return svg;
}
