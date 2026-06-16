# GraphScope — Weighted Graph Visualizer

An interactive web application for loading tabular data files and visualizing them as weighted graphs, where vertex and edge weights are reflected as physical sizes in the rendered visualization. Built with React and Vite.

## Features

- **Multi-format Data Import** — Load data files in `.csv`, `.tsv`, and `.txt` formats. Includes a dynamic column mapping UI to handle various data structures.
- **Weighted Visualization** — Vertex and edge weights are interpreted as physical sizes (node radius, edge thickness) with support for Linear, Square Root, and Logarithmic scaling modes.
- **Interactive Graph** — Force-directed layout with draggable nodes, zoom, and pan. Includes directional arrows for edges and interactive tooltips.
- **Focus Mode** — Click on any vertex to isolate it and its immediate connections, fading out the rest of the graph for focused analysis.
- **Shortest Path (Pathfinding)** — Built-in Dijkstra's algorithm to calculate and visually highlight the shortest undirected path between any two vertices, calculating distance using edge weights.
- **Real-time Analytics** — Displays graph metrics such as total Vertices, Edges, Max Degree, and Graph Density.
- **Control Panel** — Adjust physics engine parameters (repulsion, link distance) and visual sizing in real-time.
- **Export Options** — Save the resulting graph as an image (`.png`), vector (`.svg`), or raw graph data (`.json`).

## Tech Stack

- **React 19** + **Vite 8** — Fast modern frontend tooling
- **react-force-graph-2d** — Force-directed graph rendering
- **PapaParse** — Tabular data parsing
- **Lucide React** — Icons

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Graph Generator

You can generate custom random graph `.csv` files using the provided Python script:

```bash
# Generate a graph with 20 vertices and 40 edges
python3 generate_graph.py -v 20 -e 40

# For more options
python3 generate_graph.py --help
```

## Project Context

This project corresponds to **Task №4** from the Graph Theory course (Software Solutions):

> *Develop an application that: can load data files in .csv or other tabular formats; visualizes data as a graph with weights on vertices and edges, where the weights are interpreted as the physical size of the vertices and edges; can save the resulting graph image in image format.*

## License

MIT
