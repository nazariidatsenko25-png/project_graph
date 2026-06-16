import React, { useCallback, useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, Settings2, ArrowRight } from 'lucide-react';
import './FileUpload.css';

const FileUpload = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({
    source: '',
    target: '',
    edge_weight: '',
    source_weight: '',
    target_weight: '',
  });

  const handleFileUpload = (file) => {
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (!result.data || result.data.length === 0) {
          setError('Empty or invalid tabular file.');
          return;
        }
        const fields = result.meta.fields || [];
        setHeaders(fields);
        setParsedData(result.data);

        // Auto-detect mapping
        const autoMap = { source: '', target: '', edge_weight: '', source_weight: '', target_weight: '' };
        fields.forEach(f => {
          const lower = f.toLowerCase();
          if (lower.includes('source') && !lower.includes('weight')) autoMap.source = f;
          else if (lower.includes('target') && !lower.includes('weight')) autoMap.target = f;
          else if ((lower.includes('edge') && lower.includes('weight')) || (lower.includes('weight') && !lower.includes('source') && !lower.includes('target'))) autoMap.edge_weight = f;
          else if (lower.includes('source') && lower.includes('weight')) autoMap.source_weight = f;
          else if (lower.includes('target') && lower.includes('weight')) autoMap.target_weight = f;
        });
        setMapping(autoMap);
      },
      error: (err) => setError(err.message),
    });
  };

  const processData = () => {
    if (!mapping.source || !mapping.target) {
      setError('Source and Target columns are required.');
      return;
    }

    const nodesMap = new Map();
    const links = [];

    parsedData.forEach((row, i) => {
      const sourceVal = row[mapping.source];
      const targetVal = row[mapping.target];
      if (!sourceVal || !targetVal) return;

      const sourceId = sourceVal.toString().trim();
      const targetId = targetVal.toString().trim();

      const edgeWeight = mapping.edge_weight && row[mapping.edge_weight] ? parseFloat(row[mapping.edge_weight]) : 1;
      const sourceWeight = mapping.source_weight && row[mapping.source_weight] ? parseFloat(row[mapping.source_weight]) : 1;
      const targetWeight = mapping.target_weight && row[mapping.target_weight] ? parseFloat(row[mapping.target_weight]) : 1;

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
    onDataLoaded({ nodes, links });
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

  return (
    <div className="upload-screen">
      <div className="upload-brand">
        <h1>GraphScope</h1>
        <p>Weighted graph visualization from tabular data</p>
      </div>

      <div className="upload-container glass-panel">
        {!parsedData ? (
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <div className="upload-icon-wrapper">
              <Upload size={32} className="upload-icon" />
            </div>
            <h2>Upload Graph Data</h2>
            <p>Drag & drop your CSV/TSV/TXT file here</p>
            <div className="divider">or</div>
            <label className="btn">
              Browse Files
              <input type="file" accept=".csv,.tsv,.txt" onChange={(e) => handleFileUpload(e.target.files[0])} style={{ display: 'none' }} />
            </label>
            {error && <div className="error-message">{error}</div>}
            
            <div className="format-info">
              <FileText size={14} />
              <span>Supports comma or tab-separated text files.</span>
            </div>
          </div>
        ) : (
          <div className="mapping-zone animate-fade">
            <div className="mapping-header">
              <Settings2 size={22} style={{ color: 'var(--accent)' }} />
              <h2>Map Columns</h2>
            </div>
            
            <div className="mapping-grid">
              {Object.keys(mapping).map((key) => (
                <div key={key} className="mapping-field">
                  <label className="mapping-label">
                    <span>{key.replace('_', ' ')}</span>
                    {['source', 'target'].includes(key) ? (
                      <span className="required">*</span>
                    ) : (
                      <span className="optional">optional</span>
                    )}
                  </label>
                  <select
                    className="mapping-select"
                    value={mapping[key]}
                    onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
                  >
                    <option value="">-- Ignore --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {error && <div className="error-message" style={{ marginBottom: '15px' }}>{error}</div>}

            <div className="mapping-actions">
              <button className="btn-ghost" onClick={() => { setParsedData(null); setError(''); }}>
                Cancel
              </button>
              <button className="btn" onClick={processData}>
                Render Graph <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
