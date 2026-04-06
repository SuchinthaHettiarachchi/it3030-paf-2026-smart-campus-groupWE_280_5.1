import { useState } from 'react';
import { updateTicketStatus } from '../../services/ticketService';
import toast from 'react-hot-toast';

const TRANSITIONS = {
  OPEN:        ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED'],
  RESOLVED:    ['CLOSED'],
  CLOSED:      [],
  REJECTED:    [],
};

/**
 * StatusUpdateModal
 * Props:
 *  - ticket: TicketResponseDTO
 *  - onClose: () => void
 *  - onSuccess: () => void
 */
export default function StatusUpdateModal({ ticket, onClose, onSuccess }) {
  const allowed = TRANSITIONS[ticket.status] ?? [];
  const [newStatus, setNewStatus]       = useState(allowed[0] ?? '');
  const [notes, setNotes]               = useState('');
  const [rejReason, setRejReason]       = useState('');
  const [loading, setLoading]           = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newStatus) return;
    setLoading(true);
    try {
      await updateTicketStatus(ticket.id, {
        status: newStatus,
        resolutionNotes: notes || undefined,
        rejectionReason: rejReason || undefined,
      });
      toast.success(`Ticket moved to ${newStatus}`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="status-modal-title">
        <h2 className="modal-title" id="status-modal-title">Update Ticket Status</h2>

        {allowed.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>
            This ticket is <strong>{ticket.status}</strong> — no further transitions allowed.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Status</label>
              <select
                className="form-control"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                id="status-select"
              >
                {allowed.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            {(newStatus === 'RESOLVED' || newStatus === 'CLOSED') && (
              <div className="form-group">
                <label className="form-label">Resolution Notes</label>
                <textarea
                  className="form-control"
                  placeholder="Describe what was done to resolve the issue…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  id="resolution-notes-input"
                />
              </div>
            )}

            {newStatus === 'REJECTED' && (
              <div className="form-group">
                <label className="form-label">Rejection Reason</label>
                <textarea
                  className="form-control"
                  placeholder="Explain why this ticket is being rejected…"
                  value={rejReason}
                  onChange={(e) => setRejReason(e.target.value)}
                  required
                  id="rejection-reason-input"
                />
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                id="status-modal-cancel"
              >Cancel</button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !newStatus}
                id="status-modal-submit"
              >
                {loading ? 'Saving…' : 'Update Status'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
