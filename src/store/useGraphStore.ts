import { create } from 'zustand';

export type GraphNode = {
  id: string;
  weight: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
};

export type GraphLink = {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  weight: number;
};

export type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

export type ScalingMode = 'linear' | 'sqrt' | 'log';

export type GraphSettings = {
  nodeMultiplier: number;
  linkMultiplier: number;
  charge: number;
  linkDistance: number;
  showLabels: boolean;
  scalingMode: ScalingMode;
};

type GraphStore = {
  graphData: GraphData | null;
  settings: GraphSettings;
  hoverNode: string | null;
  hoverLink: GraphLink | null;
  selectedNode: string | null;
  pathStart: string;
  pathEnd: string;

  setGraphData: (data: GraphData | null) => void;
  updateSettings: (newSettings: Partial<GraphSettings>) => void;
  setHoverNode: (id: string | null) => void;
  setHoverLink: (link: GraphLink | null) => void;
  setSelectedNode: (id: string | null) => void;
  setPathStart: (id: string) => void;
  setPathEnd: (id: string) => void;
  reset: () => void;
};

const initialSettings: GraphSettings = {
  nodeMultiplier: 3,
  linkMultiplier: 1.5,
  charge: -200,
  linkDistance: 80,
  showLabels: false,
  scalingMode: 'linear',
};

export const useGraphStore = create<GraphStore>((set) => ({
  graphData: null,
  settings: initialSettings,
  hoverNode: null,
  hoverLink: null,
  selectedNode: null,
  pathStart: '',
  pathEnd: '',

  setGraphData: (data) => set({ graphData: data }),
  updateSettings: (newSettings) =>
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),
  setHoverNode: (id) => set({ hoverNode: id }),
  setHoverLink: (link) => set({ hoverLink: link }),
  setSelectedNode: (id) => set({ selectedNode: id }),
  setPathStart: (id) => set({ pathStart: id }),
  setPathEnd: (id) => set({ pathEnd: id }),
  reset: () =>
    set({
      graphData: null,
      hoverNode: null,
      hoverLink: null,
      selectedNode: null,
      pathStart: '',
      pathEnd: '',
    }),
}));
