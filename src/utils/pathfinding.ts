import { GraphData } from '../store/useGraphStore';

interface EdgeInfo {
  to: string;
  weight: number;
}

// ---------------------------------------------------------------------------
// Binary min-heap priority queue — O((V+E) log V) Dijkstra
// ---------------------------------------------------------------------------

class MinHeap {
  private heap: [number, string][] = []; // [distance, nodeId]

  get size(): number {
    return this.heap.length;
  }

  push(distance: number, nodeId: string): void {
    this.heap.push([distance, nodeId]);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): [number, string] | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[parent][0] <= this.heap[i][0]) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  private sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.heap[left][0] < this.heap[smallest][0]) smallest = left;
      if (right < n && this.heap[right][0] < this.heap[smallest][0]) smallest = right;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

// ---------------------------------------------------------------------------
// Dijkstra — finds shortest path between two nodes
// ---------------------------------------------------------------------------

export function findShortestPath(
  graphData: GraphData,
  startId: string,
  endId: string,
  isDirected = false,
) {
  if (!graphData || !startId || !endId || startId === endId) return null;

  const graph: Record<string, EdgeInfo[]> = {};
  graphData.nodes.forEach((n) => {
    graph[n.id] = [];
  });

  graphData.links.forEach((l) => {
    const srcId = typeof l.source === 'object' && l.source !== null ? l.source.id : (l.source as string);
    const tgtId = typeof l.target === 'object' && l.target !== null ? l.target.id : (l.target as string);

    if (!graph[srcId]) graph[srcId] = [];
    if (!graph[tgtId]) graph[tgtId] = [];

    const weight = l.weight || 1;
    graph[srcId].push({ to: tgtId, weight });
    if (!isDirected) {
      graph[tgtId].push({ to: srcId, weight });
    }
  });

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visited = new Set<string>();
  const pq = new MinHeap();

  graphData.nodes.forEach((n) => {
    distances[n.id] = Infinity;
    previous[n.id] = null;
  });

  distances[startId] = 0;
  pq.push(0, startId);

  while (pq.size > 0) {
    const entry = pq.pop();
    if (!entry) break;
    const [dist, node] = entry;

    if (visited.has(node)) continue;
    visited.add(node);

    if (node === endId) break;

    if (dist > distances[node]) continue;

    for (const edge of graph[node] ?? []) {
      const alt = distances[node] + edge.weight;
      if (alt < distances[edge.to]) {
        distances[edge.to] = alt;
        previous[edge.to] = node;
        pq.push(alt, edge.to);
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
