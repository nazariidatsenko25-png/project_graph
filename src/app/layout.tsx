import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GraphScope',
  description: 'Weighted graph visualization from tabular data',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
