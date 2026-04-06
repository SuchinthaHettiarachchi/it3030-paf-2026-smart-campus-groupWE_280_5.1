import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, User, Tag, AlertTriangle,
  Clock, Image, Settings,
} from 'lucide-react';
import TicketStatusBadge from '../../components/ticket/TicketStatusBadge';
import TicketPriorityBadge from '../../components/ticket/TicketPriorityBadge';
import CommentSection from '../../components/ticket/CommentSection';
import StatusUpdateModal from '../../components/ticket/StatusUpdateModal';
import * as ticketService from '../../services/ticketService';

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await ticketService.getTicketById(id);
      setTicket(res.data);
    } catch (err) {
      console.error('Failed to fetch ticket:', err);
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await ticketService.getComments(id);
      setComments(res.data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  }, [id]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchTicket(), fetchComments()]);
      setLoading(false);
    };
    load();
  }, [fetchTicket, fetchComments]);

  const handleStatusUpdate = async (data) => {
    await ticketService.updateTicketStatus(id, data);
    await fetchTicket();
  };

  const handleDeleteAttachment = async (attachId) => {
    if (!confirm('Delete this attachment?')) return;
    try {
      await ticketService.deleteAttachment(id, attachId);
      await fetchTicket();
    } catch (err) {
      console.error('Failed to delete attachment:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="page-body">
        <div className="loading-spinner"><div className="spinner" /></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="page-body">
        <div className="empty-state">
          <h3>Ticket not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/tickets')}>
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <button className="back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="page-header-actions">
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
              <span className="badge" style={{
                background: 'var(--bg-glass)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
              }}>
                {ticket.category}
              </span>
            </div>
            <h1>{ticket.title}</h1>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setShowStatusModal(true)}
            id="update-status-btn"
          >
            <Settings size={16} /> Update Status
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Info Grid */}
        <div className="ticket-info-grid">
          <div className="info-card">
            <div className="info-card-label"><Calendar size={12} style={{ display: 'inline', marginRight: '0.3rem' }} /> Created</div>
            <div className="info-card-value">{formatDate(ticket.createdAt)}</div>
          </div>
          <div className="info-card">
            <div className="info-card-label"><Clock size={12} style={{ display: 'inline', marginRight: '0.3rem' }} /> Updated</div>
            <div className="info-card-value">{formatDate(ticket.updatedAt)}</div>
          </div>
          {ticket.location && (
            <div className="info-card">
              <div className="info-card-label"><MapPin size={12} style={{ display: 'inline', marginRight: '0.3rem' }} /> Location</div>
              <div className="info-card-value">{ticket.location}</div>
            </div>
          )}
          {ticket.assignedTo && (
            <div className="info-card">
              <div className="info-card-label"><User size={12} style={{ display: 'inline', marginRight: '0.3rem' }} /> Assigned To</div>
              <div className="info-card-value">{ticket.assignedTo.substring(0, 8)}...</div>
            </div>
          )}
          {ticket.resolvedAt && (
            <div className="info-card">
              <div className="info-card-label">Resolved At</div>
              <div className="info-card-value">{formatDate(ticket.resolvedAt)}</div>
            </div>
          )}
          {ticket.closedAt && (
            <div className="info-card">
              <div className="info-card-label">Closed At</div>
              <div className="info-card-value">{formatDate(ticket.closedAt)}</div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3>Description</h3>
          </div>
          <div className="card-body">
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {ticket.description}
            </p>
          </div>
        </div>

        {/* Contact Info */}
        {(ticket.contactName || ticket.contactPhone || ticket.contactEmail) && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header"><h3>Contact Information</h3></div>
            <div className="card-body">
              <div className="ticket-info-grid">
                {ticket.contactName && (
                  <div className="info-card">
                    <div className="info-card-label">Name</div>
                    <div className="info-card-value">{ticket.contactName}</div>
                  </div>
                )}
                {ticket.contactPhone && (
                  <div className="info-card">
                    <div className="info-card-label">Phone</div>
                    <div className="info-card-value">{ticket.contactPhone}</div>
                  </div>
                )}
                {ticket.contactEmail && (
                  <div className="info-card">
                    <div className="info-card-label">Email</div>
                    <div className="info-card-value">{ticket.contactEmail}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resolution / Rejection Notes */}
        {ticket.resolutionNotes && (
          <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div className="card-header"><h3>✅ Resolution Notes</h3></div>
            <div className="card-body">
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                {ticket.resolutionNotes}
              </p>
            </div>
          </div>
        )}

        {ticket.rejectionReason && (
          <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <div className="card-header"><h3>❌ Rejection Reason</h3></div>
            <div className="card-body">
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                {ticket.rejectionReason}
              </p>
            </div>
          </div>
        )}

        {/* Attachments */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h3><Image size={16} style={{ display: 'inline', marginRight: '0.4rem' }} /> Attachments ({ticket.attachments.length})</h3>
            </div>
            <div className="card-body">
              <div className="attachment-previews">
                {ticket.attachments.map(att => (
                  <div key={att.id} className="attachment-preview" style={{ width: '180px', height: '180px' }}>
                    <img src={att.fileUrl} alt={att.fileName} />
                    <button
                      className="remove-btn"
                      onClick={() => handleDeleteAttachment(att.id)}
                      title="Delete attachment"
                    >
                      ×
                    </button>
                    <div className="attachment-info">{att.fileName}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="card">
          <div className="card-body">
            <CommentSection
              ticketId={id}
              comments={comments}
              onCommentsChange={fetchComments}
            />
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <StatusUpdateModal
          ticket={ticket}
          onClose={() => setShowStatusModal(false)}
          onUpdate={handleStatusUpdate}
        />
      )}
    </>
  );
}
