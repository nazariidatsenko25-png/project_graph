import { GraphData, GraphLink } from '../store/useGraphStore';

type EdgeInfo = {
  to: string;
  weight: number;
};

export function findShortestPath(
  graphData: GraphData,
  startId: string,
  endId: string
) {
  if (!graphData || !startId || !endId || startId === endId) return null;

  const graph: Record<string, EdgeInfo[]> = {};
  graphData.nodes.forEach((n) => {
    graph[n.id] = [];
  });

  graphData.links.forEach((l) => {
    const sourceId =
      typeof l.source === 'object' && l.source !== null ? l.source.id : l.source;
    const targetId =
      typeof l.target === 'object' && l.target !== null ? l.target.id : l.target;

    if (!graph[sourceId]) graph[sourceId] = [];
    if (!graph[targetId]) graph[targetId] = [];

    const weight = l.weight || 1;
    graph[sourceId].push({ to: targetId, weight });
    graph[targetId].push({ to: sourceId, weight }); // Undirected
  });

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const pq = new Set(graphData.nodes.map((n) => n.id));

  graphData.nodes.forEach((n) => {
    distances[n.id] = Infinity;
    previous[n.id] = null;
  });
  distances[startId] = 0;

  while (pq.size > 0) {
    let minNode: string | null = null;
    let minDistance = Infinity;
    for (const nodeId of pq) {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        minNode = nodeId;
      }
    }

    if (minNode === null || minNode === endId) break;
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

  if (previous[endId] === null) {
    return { pathNodes: new Set<string>(), pathLinks: new Set<string>(), totalCost: null };
  }

  const path: string[] = [];
  let curr: string | null = endId;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous[curr];
  }

  const pathLinks = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) {
    pathLinks.add(`${path[i]}->${path[i + 1]}`);
  }

  return {
    pathNodes: new Set(path),
    pathLinks,
    totalCost: distances[endId].toFixed(2),
  };
}
