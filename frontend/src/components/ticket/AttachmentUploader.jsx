import React, { useState, useRef } from 'react';
import { Upload, X, Image } from 'lucide-react';

export default function AttachmentUploader({ files, setFiles, existingAttachments = [], onRemoveExisting }) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const maxFiles = 3;
  const totalFiles = files.length + existingAttachments.length;

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    addFiles(droppedFiles);
  };

  const handleSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    addFiles(selectedFiles);
    e.target.value = '';
  };

  const addFiles = (newFiles) => {
    const remaining = maxFiles - totalFiles;
    if (remaining <= 0) return;
    const toAdd = newFiles.slice(0, remaining);
    setFiles(prev => [...prev, ...toAdd]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div>
      {totalFiles < maxFiles && (
        <div
          className={`dropzone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          id="attachment-dropzone"
        >
          <Upload className="dropzone-icon" />
          <p className="dropzone-text">
            <strong>Click to upload</strong> or drag and drop
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Images only (PNG, JPG, WebP) • Max {maxFiles - totalFiles} more
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleSelect}
            style={{ display: 'none' }}
            id="attachment-file-input"
          />
        </div>
      )}

      {(existingAttachments.length > 0 || files.length > 0) && (
        <div className="attachment-previews">
          {existingAttachments.map((att) => (
            <div key={att.id} className="attachment-preview">
              <img src={att.fileUrl} alt={att.fileName} />
              {onRemoveExisting && (
                <button
                  className="remove-btn"
                  onClick={() => onRemoveExisting(att.id)}
                  title="Remove"
                >
                  <X size={14} />
                </button>
              )}
              <div className="attachment-info">
                {att.fileName}
                {att.fileSize && ` • ${formatSize(att.fileSize)}`}
              </div>
            </div>
          ))}

          {files.map((file, index) => (
            <div key={index} className="attachment-preview">
              <img src={URL.createObjectURL(file)} alt={file.name} />
              <button
                className="remove-btn"
                onClick={() => removeFile(index)}
                title="Remove"
              >
                <X size={14} />
              </button>
              <div className="attachment-info">
                {file.name} • {formatSize(file.size)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
