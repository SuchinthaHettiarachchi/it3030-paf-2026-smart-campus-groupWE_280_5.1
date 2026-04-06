import React, { useState } from 'react';
import { X } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function StatusUpdateModal({ ticket, onClose, onUpdate }) {
  const [status, setStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Valid transitions
  const validTransitions = {
    OPEN: ['IN_PROGRESS', 'REJECTED'],
    IN_PROGRESS: ['RESOLVED', 'REJECTED'],
    RESOLVED: ['CLOSED'],
    CLOSED: [],
    REJECTED: [],
  };

  const allowedStatuses = validTransitions[ticket.status] || [];

  const handleSubmit = async () => {
    if (!status) {
      setError('Please select a status');
      return;
    }
    if (status === 'RESOLVED' && !resolutionNotes.trim()) {
      setError('Resolution notes are required');
      return;
    }
    if (status === 'REJECTED' && !rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onUpdate({
        status,
        resolutionNotes: resolutionNotes.trim() || undefined,
        rejectionReason: rejectionReason.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  if (allowedStatuses.length === 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Update Status</h3>
            <button className="btn btn-ghost" onClick={onClose}><X size={18} /></button>
          </div>
          <div className="modal-body">
            <p style={{ color: 'var(--text-secondary)' }}>
              This ticket is <strong>{ticket.status}</strong> and cannot be transitioned further.
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose} id="status-update-modal">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Update Ticket Status</h3>
          <button className="btn btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Current status: <strong style={{ color: 'var(--text-primary)' }}>{ticket.status}</strong>
          </p>

          <div className="form-group">
            <label className="form-label">New Status *</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              id="status-select"
            >
              <option value="">Select status...</option>
              {STATUS_OPTIONS
                .filter(opt => allowedStatuses.includes(opt.value))
                .map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
          </div>

          {status === 'RESOLVED' && (
            <div className="form-group">
              <label className="form-label">Resolution Notes *</label>
              <textarea
                className="form-textarea"
                placeholder="Describe how the issue was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                id="resolution-notes-input"
              />
            </div>
          )}

          {status === 'REJECTED' && (
            <div className="form-group">
              <label className="form-label">Rejection Reason *</label>
              <textarea
                className="form-textarea"
                placeholder="Explain why this ticket is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                id="rejection-reason-input"
              />
            </div>
          )}

          {error && <p className="form-error" style={{ marginTop: '0.5rem' }}>{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
            id="status-submit-btn"
          >
            {submitting ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}
