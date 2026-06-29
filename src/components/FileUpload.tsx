'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, Settings2, ArrowRight } from 'lucide-react';
import { useGraphStore, GraphData, GraphNode, GraphLink } from '../store/useGraphStore';
import { validateMapping } from '../utils/validation';
import clsx from 'clsx';

type ParsedRow = Record<string, string>;

type ColumnMapping = {
  source: string;
  target: string;
  edge_weight: string;
  source_weight: string;
  target_weight: string;
};

const EMPTY_MAPPING: ColumnMapping = {
  source: '',
  target: '',
  edge_weight: '',
  source_weight: '',
  target_weight: '',
};

export default function FileUpload() {
  const setGraphData = useGraphStore((state) => state.setGraphData);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [parsedData, setParsedData] = useState<ParsedRow[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>(EMPTY_MAPPING);

  // Refs for Anime.js entrance animation targets
  const heroRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const runEntrance = async () => {
      const { createTimeline } = await import('animejs');

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      if (!titleRef.current || !subtitleRef.current || !cardRef.current) return;

      const tl = createTimeline({});

      tl.add(titleRef.current, {
        translateY: [40, 0],
        opacity: [0, 1],
        duration: 900,
        ease: 'outExpo',
      });

      tl.add(subtitleRef.current, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 700,
        ease: 'outExpo',
      }, '-=600');

      tl.add(cardRef.current, {
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 800,
        ease: 'outQuart',
      }, '-=500');
    };

    runEntrance();
  }, []);


  const handleFileUpload = (file: File) => {
    if (!file) return;

    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (!result.data || result.data.length === 0) {
          setError('Empty or invalid tabular file.');
          return;
        }
        const fields = result.meta.fields ?? [];
        setHeaders(fields);
        setParsedData(result.data);

        // Auto-detect column mapping
        const autoMap: ColumnMapping = { ...EMPTY_MAPPING };
        fields.forEach((f) => {
          const lower = f.toLowerCase();
          if (lower.includes('source') && !lower.includes('weight')) autoMap.source = f;
          else if (lower.includes('target') && !lower.includes('weight')) autoMap.target = f;
          else if (
            (lower.includes('edge') && lower.includes('weight')) ||
            (lower.includes('weight') && !lower.includes('source') && !lower.includes('target'))
          )
            autoMap.edge_weight = f;
          else if (lower.includes('source') && lower.includes('weight')) autoMap.source_weight = f;
          else if (lower.includes('target') && lower.includes('weight')) autoMap.target_weight = f;
        });
        setMapping(autoMap);
      },
      error: (err) => setError(err.message),
    });
  };

  const processData = () => {
    const validation = validateMapping(mapping);
    if (!validation.success) {
      setError(validation.errors?.[0] ?? 'Invalid mapping');
      return;
    }

    const nodesMap = new Map<string, GraphNode>();
    const links: GraphLink[] = [];

    parsedData?.forEach((row, i) => {
      const sourceVal = row[mapping.source];
      const targetVal = row[mapping.target];
      if (!sourceVal || !targetVal) return;

      const sourceId = sourceVal.trim();
      const targetId = targetVal.trim();

      const edgeWeight =
        mapping.edge_weight && row[mapping.edge_weight] ? parseFloat(row[mapping.edge_weight]) : 1;
      const sourceWeight =
        mapping.source_weight && row[mapping.source_weight]
          ? parseFloat(row[mapping.source_weight])
          : 1;
      const targetWeight =
        mapping.target_weight && row[mapping.target_weight]
          ? parseFloat(row[mapping.target_weight])
          : 1;

      if (!nodesMap.has(sourceId)) {
        nodesMap.set(sourceId, { id: sourceId, weight: isNaN(sourceWeight) ? 1 : sourceWeight });
      }
      if (!nodesMap.has(targetId)) {
        nodesMap.set(targetId, { id: targetId, weight: isNaN(targetWeight) ? 1 : targetWeight });
      }

      links.push({
        source: sourceId,
        target: targetId,
        weight: isNaN(edgeWeight) ? 1 : edgeWeight,
        id: `e${i}`,
      });
    });

    const nodes = Array.from(nodesMap.values());
    if (nodes.length === 0) {
      setError('No valid graph data found.');
      return;
    }

    setError('');
    setGraphData({ nodes, links } as GraphData);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, []);

  return (
    <div ref={heroRef} className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">
      <div className="text-center mb-10 max-w-lg mx-auto">
        <h1
          ref={titleRef}
          style={{ opacity: 0, fontFamily: 'var(--font-mono)' }}
          className="text-5xl font-extrabold tracking-tight text-white mb-4"
        >
          GraphScope
        </h1>
        <p
          ref={subtitleRef}
          style={{ opacity: 0, fontFamily: 'var(--font-ui)' }}
          className="text-[var(--text-secondary)] text-lg"
        >
          Weighted graph visualization from tabular data
        </p>
      </div>

      <div ref={cardRef} style={{ opacity: 0 }} className="w-full max-w-2xl glass-panel rounded-[var(--radius-lg)] p-8">
        {!parsedData ? (
          <div
            className={clsx(
              'border-2 border-dashed border-[var(--border-subtle)] rounded-[var(--radius-md)] p-12 text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[300px] cursor-pointer',
              isDragging
                ? 'border-[var(--accent)] bg-[rgba(34,211,238,0.05)] scale-[1.02]'
                : 'hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.02)]',
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <div
              className={clsx(
                'w-16 h-16 rounded-full bg-[var(--accent-dim)] flex items-center justify-center mb-6 text-[var(--accent)] transition-transform duration-300',
                isDragging && 'scale-110',
              )}
            >
              <Upload size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upload Graph Data</h2>
            <p className="text-[var(--text-secondary)] mb-6">Drag &amp; drop your CSV/TSV/TXT file here</p>
            <div className="flex items-center w-full max-w-xs mb-6 opacity-40">
              <div className="flex-1 h-px bg-[var(--text-secondary)]" />
              <span className="px-4 text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">or</span>
              <div className="flex-1 h-px bg-[var(--text-secondary)]" />
            </div>
            <label className="cursor-pointer bg-white text-[#080e1c] font-semibold py-3 px-8 rounded-[var(--radius-md)] transition-all hover:bg-[var(--foreground)] hover:-translate-y-0.5 active:translate-y-0 shadow-lg select-none">
              Browse Files
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
            </label>
            {error && (
              <div className="mt-4 p-3 bg-[rgba(251,113,133,0.1)] text-[var(--danger)] border border-[rgba(251,113,133,0.2)] rounded-[var(--radius-md)] text-sm font-medium w-full text-left" role="alert">
                {error}
              </div>
            )}
            <div className="mt-8 flex items-center gap-2 text-[var(--text-secondary)] text-sm bg-[rgba(0,0,0,0.2)] py-2 px-4 rounded-full border border-[var(--border-subtle)]">
              <FileText size={14} />
              <span>Supports comma or tab-separated text files.</span>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 pb-6 mb-6 border-b border-[var(--border-subtle)]">
              <Settings2 size={24} className="text-[var(--accent)]" />
              <h2 className="text-xl font-bold m-0">Map Columns</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {(Object.keys(mapping) as (keyof ColumnMapping)[]).map((key) => (
                <div key={key} className="flex flex-col gap-2">
                  <label className="flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    <span>{key.replace('_', ' ')}</span>
                    {['source', 'target'].includes(key) ? (
                      <span className="text-[var(--danger)]">*</span>
                    ) : (
                      <span className="text-xs font-normal opacity-60 normal-case tracking-normal">optional</span>
                    )}
                  </label>
                  <select
                    className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--border-subtle)] text-white p-3 rounded-[var(--radius-md)] text-sm outline-none transition-all focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] hover:border-[rgba(255,255,255,0.2)] cursor-pointer"
                    value={mapping[key]}
                    onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
                  >
                    <option value="">-- Ignore --</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-[rgba(251,113,133,0.1)] text-[var(--danger)] border border-[rgba(251,113,133,0.2)] rounded-[var(--radius-md)] text-sm font-medium" role="alert">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-4 pt-6 border-t border-[var(--border-subtle)]">
              <button
                className="px-6 py-2.5 rounded-[var(--radius-md)] font-medium transition-colors hover:bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] hover:text-white cursor-pointer"
                onClick={() => { setParsedData(null); setError(''); }}
              >
                Cancel
              </button>
              <button
                className="flex items-center gap-2 bg-[var(--accent)] text-[#080e1c] font-bold py-2.5 px-6 rounded-[var(--radius-md)] transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] active:scale-95 cursor-pointer"
                onClick={processData}
              >
                Render Graph <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
