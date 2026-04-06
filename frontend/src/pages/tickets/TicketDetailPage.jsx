import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicketById, deleteAttachment, uploadAttachment } from '../../services/ticketService';
import TicketStatusBadge   from '../../components/ticket/TicketStatusBadge.jsx';
import TicketPriorityBadge from '../../components/ticket/TicketPriorityBadge.jsx';
import CommentSection      from '../../components/ticket/CommentSection.jsx';
import StatusUpdateModal   from '../../components/ticket/StatusUpdateModal.jsx';
import toast from 'react-hot-toast';

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);

  // TODO: Replace with real user from Chanuka's AuthContext
  const currentUserId   = localStorage.getItem('userId')   ?? null;
  const userRole        = localStorage.getItem('userRole') ?? 'USER';
  const isAdminOrTech   = userRole === 'ADMIN' || userRole === 'TECHNICIAN';

  const load = useCallback(() => {
    setLoading(true);
    getTicketById(id)
      .then((res) => setTicket(res.data))
      .catch(() => toast.error('Failed to load ticket'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteAttachment = async (attachId) => {
    if (!window.confirm('Delete this attachment?')) return;
    try {
      await deleteAttachment(id, attachId);
      toast.success('Attachment removed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to delete attachment');
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString() : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  if (loading) return <div className="spinner" style={{ marginTop: '4rem' }} />;
  if (!ticket) return <div className="page-shell"><p>Ticket not found.</p></div>;

  return (
    <main className="page-shell">
      {/* Header */}
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tickets')} style={{ marginBottom: '.75rem' }}>
            ← Back to Tickets
          </button>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{ticket.title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '.85rem', marginTop: '.25rem' }}>
            Reported {fmtDate(ticket.createdAt)} · {ticket.category}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <TicketStatusBadge   status={ticket.status} />
          <TicketPriorityBadge priority={ticket.priority} />
          {isAdminOrTech && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowModal(true)}
              id="update-status-btn"
            >
              Update Status
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Main content */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '1rem' }}>
              Description
            </h2>
            <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>

            {ticket.location && (
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '.875rem' }}>
                📍 <strong>Location:</strong> {ticket.location}
              </p>
            )}

            {ticket.resolutionNotes && (
              <div style={{ marginTop: '1.25rem', padding: '.9rem', background: '#22c55e11', borderRadius: '8px', borderLeft: '3px solid #22c55e' }}>
                <p style={{ fontSize: '.8rem', fontWeight: 700, color: '#22c55e', marginBottom: '.25rem' }}>RESOLUTION NOTES</p>
                <p style={{ fontSize: '.875rem' }}>{ticket.resolutionNotes}</p>
              </div>
            )}

            {ticket.rejectionReason && (
              <div style={{ marginTop: '1.25rem', padding: '.9rem', background: '#ef444411', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>
                <p style={{ fontSize: '.8rem', fontWeight: 700, color: '#ef4444', marginBottom: '.25rem' }}>REJECTION REASON</p>
                <p style={{ fontSize: '.875rem' }}>{ticket.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Attachments */}
          {ticket.attachments?.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '1rem' }}>
                Attachments ({ticket.attachments.length})
              </h2>
              <div className="attachment-grid">
                {ticket.attachments.map((a) => (
                  <div key={a.id} className="attachment-thumb" id={`attachment-${a.id}`}>
                    <a href={a.fileUrl} target="_blank" rel="noreferrer">
                      <img src={a.fileUrl} alt={a.fileName} />
                    </a>
                    {(isAdminOrTech || ticket.reportedBy === currentUserId) && (
                      <button
                        className="attachment-remove"
                        onClick={() => handleDeleteAttachment(a.id)}
                        title="Delete attachment"
                        id={`delete-attachment-${a.id}`}
                      >×</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="card">
            <CommentSection
              ticketId={id}
              comments={ticket.comments ?? []}
              currentUserId={currentUserId}
              isAdminOrTech={isAdminOrTech}
              onRefresh={load}
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside>
          <div className="card">
            <h2 style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '1rem' }}>
              Details
            </h2>
            {[
              { label: 'Status',      value: <TicketStatusBadge status={ticket.status} /> },
              { label: 'Priority',    value: <TicketPriorityBadge priority={ticket.priority} /> },
              { label: 'Category',    value: ticket.category },
              { label: 'Reported',    value: fmtDate(ticket.createdAt) },
              { label: 'Resolved',    value: fmt(ticket.resolvedAt) },
              { label: 'Closed',      value: fmt(ticket.closedAt) },
              { label: 'Assigned To', value: ticket.assignedTo ? ticket.assignedTo.slice(0, 8) + '…' : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: '.85rem', textAlign: 'right' }}>{value}</span>
              </div>
            ))}

            {(ticket.contactName || ticket.contactPhone || ticket.contactEmail) && (
              <>
                <p style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '1rem', marginBottom: '.5rem' }}>Contact</p>
                {ticket.contactName  && <p style={{ fontSize: '.85rem' }}>👤 {ticket.contactName}</p>}
                {ticket.contactPhone && <p style={{ fontSize: '.85rem' }}>📞 {ticket.contactPhone}</p>}
                {ticket.contactEmail && <p style={{ fontSize: '.85rem' }}>✉️ {ticket.contactEmail}</p>}
              </>
            )}
          </div>
        </aside>
      </div>

      {showModal && (
        <StatusUpdateModal
          ticket={ticket}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); load(); }}
        />
      )}
    </main>
  );
}
