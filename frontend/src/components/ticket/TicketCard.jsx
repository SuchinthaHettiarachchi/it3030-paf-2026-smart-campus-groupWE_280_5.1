import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Paperclip, MessageSquare } from 'lucide-react';
import TicketStatusBadge from './TicketStatusBadge';
import TicketPriorityBadge from './TicketPriorityBadge';

const categoryIcons = {
  ELECTRICAL: '⚡',
  PLUMBING: '🔧',
  IT: '💻',
  FURNITURE: '🪑',
  OTHER: '📋',
};

export default function TicketCard({ ticket }) {
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="ticket-card"
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      role="button"
      tabIndex={0}
      id={`ticket-card-${ticket.id}`}
    >
      <div className="ticket-card-header">
        <div>
          <div className="ticket-card-badges" style={{ marginBottom: '0.5rem' }}>
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
          </div>
          <h3 className="ticket-card-title">{ticket.title}</h3>
        </div>
        <span style={{ fontSize: '1.5rem' }}>
          {categoryIcons[ticket.category] || '📋'}
        </span>
      </div>

      <p className="ticket-card-desc">{ticket.description}</p>

      <div className="ticket-card-footer">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {ticket.location && (
            <span className="ticket-meta-item">
              <MapPin size={14} /> {ticket.location}
            </span>
          )}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <span className="ticket-meta-item">
              <Paperclip size={14} /> {ticket.attachments.length}
            </span>
          )}
          {ticket.commentCount > 0 && (
            <span className="ticket-meta-item">
              <MessageSquare size={14} /> {ticket.commentCount}
            </span>
          )}
        </div>
        <span className="ticket-card-date">
          <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
          {formatDate(ticket.createdAt)}
        </span>
      </div>
    </div>
  );
}
