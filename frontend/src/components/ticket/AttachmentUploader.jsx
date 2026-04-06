import { useState, useRef } from 'react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILES = 3;

/**
 * AttachmentUploader
 * Props:
 *  - files: File[]   — controlled list of staged files
 *  - onChange: (files: File[]) => void
 */
export default function AttachmentUploader({ files = [], onChange }) {
  const [over, setOver] = useState(false);
  const inputRef = useRef();

  const addFiles = (incoming) => {
    const valid = Array.from(incoming).filter((f) => ALLOWED_TYPES.includes(f.type));
    const invalid = Array.from(incoming).length - valid.length;
    if (invalid > 0) alert(`${invalid} file(s) skipped — only images (jpeg, png, gif, webp) allowed.`);

    const combined = [...files, ...valid].slice(0, MAX_FILES);
    onChange(combined);
  };

  const remove = (idx) => {
    const next = files.filter((_, i) => i !== idx);
    onChange(next);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setOver(false);
    addFiles(e.dataTransfer.files);
  };

  const fmt = (bytes) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  return (
    <div>
      {files.length < MAX_FILES && (
        <div
          className={`drop-zone${over ? ' over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          id="attachment-drop-zone"
        >
          <span style={{ fontSize: '1.8rem' }}>🖼️</span>
          <p>Drag & drop images here, or <strong>click to browse</strong></p>
          <p style={{ fontSize: '.75rem' }}>
            {files.length}/{MAX_FILES} uploaded · Max 5 MB each · jpeg, png, gif, webp
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(',')}
            style={{ display: 'none' }}
            onChange={(e) => addFiles(e.target.files)}
            id="attachment-file-input"
          />
        </div>
      )}

      {files.length > 0 && (
        <div className="attachment-grid" style={{ marginTop: '.75rem' }}>
          {files.map((file, idx) => (
            <div key={idx} className="attachment-thumb" id={`attachment-preview-${idx}`}>
              <img src={URL.createObjectURL(file)} alt={file.name} />
              <button
                className="attachment-remove"
                onClick={(e) => { e.stopPropagation(); remove(idx); }}
                title="Remove"
                aria-label={`Remove ${file.name}`}
              >×</button>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: '#00000099', fontSize: '.65rem', padding: '2px 4px',
                color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {fmt(file.size)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
