import { GraphData, GraphSettings } from '../store/useGraphStore';

export function exportToPng(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = 'graph-visualization.png';
  link.href = url;
  link.click();
}

export function exportToJson(graphData: GraphData | null) {
  if (!graphData) return;
  // Create a clean copy to avoid circular references if object links are used
  const cleanData = {
    nodes: graphData.nodes.map(n => ({ id: n.id, weight: n.weight, x: n.x, y: n.y })),
    links: graphData.links.map(l => ({
      source: typeof l.source === 'object' ? l.source.id : l.source,
      target: typeof l.target === 'object' ? l.target.id : l.target,
      weight: l.weight
    }))
  };
  const dataStr = JSON.stringify(cleanData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'graph-data.json';
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToSvg(graphData: GraphData | null, settings: GraphSettings) {
  if (!graphData) return;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  graphData.nodes.forEach(n => {
    if (n.x !== undefined && n.x < minX) minX = n.x;
    if (n.y !== undefined && n.y < minY) minY = n.y;
    if (n.x !== undefined && n.x > maxX) maxX = n.x;
    if (n.y !== undefined && n.y > maxY) maxY = n.y;
  });

  const padding = 100;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;
  const viewBox = `${minX - padding} ${minY - padding} ${width} ${height}`;

  const getScaledWeight = (w: number) => {
    if (settings.scalingMode === 'log') return Math.max(0.1, Math.log10(w + 1));
    if (settings.scalingMode === 'sqrt') return Math.max(0.1, Math.sqrt(w));
    return w;
  };

  const weightToColor = (weight: number, minW: number, maxW: number) => {
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

  const nodeWeights = graphData.nodes.map(n => n.weight || 1);
  const minWeight = Math.min(...nodeWeights);
  const maxWeight = Math.max(...nodeWeights);

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

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'graph-visualization.svg';
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
