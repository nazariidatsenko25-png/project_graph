# GraphScope — Weighted Graph Visualizer

An interactive web application for loading tabular data files (CSV) and visualizing them as weighted graphs, where vertex and edge weights are reflected as physical sizes in the rendered visualization. Built with React and Vite.

## Features

- **CSV Data Import** — Load data files in `.csv` format and parse them into graph structures
- **Weighted Visualization** — Vertex and edge weights are interpreted as physical sizes (node radius, edge thickness)
- **Interactive Graph** — Force-directed layout with draggable nodes, zoom, and pan (powered by `react-force-graph-2d`)
- **Control Panel** — Adjust visualization parameters in real-time
- **Image Export** — Save the resulting graph image in image format

## Tech Stack

- **React 19** + **Vite 8** — Fast modern frontend tooling
- **react-force-graph-2d** — Force-directed graph rendering
- **PapaParse** — CSV parsing
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

## Project Context

This project corresponds to **Task №4** from the Graph Theory course (Software Solutions):

> *Develop an application that: can load data files in .csv or other tabular formats; visualizes data as a graph with weights on vertices and edges, where the weights are interpreted as the physical size of the vertices and edges; can save the resulting graph image in image format.*

## License

MIT
