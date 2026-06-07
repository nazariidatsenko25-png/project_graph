import React, { useCallback, useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText } from 'lucide-react';
import './FileUpload.css';

const FileUpload = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const processData = (result) => {
    if (!result.data || result.data.length === 0) {
      setError('Empty or invalid CSV file.');
      return;
    }

    const nodesMap = new Map();
    const links = [];

    result.data.forEach((row, i) => {
      if (!row.source || !row.target) return;

      const sourceId = row.source.toString().trim();
      const targetId = row.target.toString().trim();

      const edgeWeight = parseFloat(row.edge_weight) || 1;
      const sourceWeight = parseFloat(row.source_weight) || 1;
      const targetWeight = parseFloat(row.target_weight) || 1;

      if (!nodesMap.has(sourceId)) {
        nodesMap.set(sourceId, { id: sourceId, weight: sourceWeight });
      }
      if (!nodesMap.has(targetId)) {
        nodesMap.set(targetId, { id: targetId, weight: targetWeight });
      }

      links.push({
        source: sourceId,
        target: targetId,
        weight: edgeWeight,
        id: `e${i}`,
      });
    });

    const nodes = Array.from(nodesMap.values());
    if (nodes.length === 0) {
      setError(
        'No valid graph data found. Ensure your CSV has headers: source, target, edge_weight, source_weight, target_weight'
      );
      return;
    }

    setError('');
    onDataLoaded({ nodes, links });
  };

  const handleFileUpload = (file) => {
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: processData,
      error: (err) => setError(err.message),
    });
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      handleFileUpload(file);
    } else {
      setError('Please upload a .csv file.');
    }
  }, []);

  return (
    <div className="upload-screen">
      {/* Animated background is rendered by App */}
      <div className="upload-brand">
        <h1>GraphScope</h1>
        <p>Weighted graph visualization from tabular data</p>
      </div>

      <div className="upload-container glass-panel">
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <div className="upload-icon-wrapper">
            <Upload size={32} className="upload-icon" />
          </div>
          <h2>Upload Graph Data</h2>
          <p>Drag & drop your CSV file here</p>
          <div className="divider">or</div>
          <label className="btn">
            Browse Files
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </label>

          {error && <div className="error-message">{error}</div>}

          <div className="format-info">
            <FileText size={14} />
            <span>
              Headers: <code>source, target, edge_weight, source_weight, target_weight</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
