import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GraphScope — Weighted Graph Visualizer',
  description: 'Upload CSV/TSV data and explore weighted graphs in 2D or 3D with shortest-path finding and live export.',
  openGraph: {
    title: 'GraphScope — Weighted Graph Visualizer',
    description: 'Interactive weighted graph visualization from tabular data.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts preconnect for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
