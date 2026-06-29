import { GraphData, GraphSettings } from '../store/useGraphStore';
import { buildSvgExport } from './graphHelpers';

export function exportToPng(canvas: HTMLCanvasElement | null): void {
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = 'graph-visualization.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function exportToJson(graphData: GraphData | null): void {
  if (!graphData) return;
  const cleanData = {
    nodes: graphData.nodes.map((n) => ({ id: n.id, weight: n.weight, x: n.x, y: n.y })),
    links: graphData.links.map((l) => ({
      source: typeof l.source === 'object' ? l.source.id : l.source,
      target: typeof l.target === 'object' ? l.target.id : l.target,
      weight: l.weight,
    })),
  };
  const blob = new Blob([JSON.stringify(cleanData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'graph-data.json';
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToSvg(graphData: GraphData | null, settings: GraphSettings): void {
  if (!graphData) return;
  const svg = buildSvgExport(graphData, settings);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'graph-visualization.svg';
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
