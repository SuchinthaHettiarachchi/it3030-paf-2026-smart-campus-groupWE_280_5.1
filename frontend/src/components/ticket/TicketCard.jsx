import TicketStatusBadge   from './TicketStatusBadge.jsx';
import TicketPriorityBadge from './TicketPriorityBadge.jsx';
import { useNavigate } from 'react-router-dom';

export default function TicketCard({ ticket }) {
  const navigate = useNavigate();
  const fmt = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div
      className="card"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/tickets/${ticket.id}`)}
      id={`ticket-card-${ticket.id}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
        <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
          {ticket.category}
        </span>
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <TicketStatusBadge   status={ticket.status} />
          <TicketPriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '.35rem', lineHeight: 1.4 }}>
        {ticket.title}
      </h3>

      {ticket.location && (
        <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '.4rem' }}>
          📍 {ticket.location}
        </p>
      )}

      <p style={{
        fontSize: '.83rem', color: 'var(--text-muted)',
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
        marginBottom: '.8rem'
      }}>
        {ticket.description}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: 'var(--text-muted)' }}>
        <span>Reported {fmt(ticket.createdAt)}</span>
        {ticket.assignedTo && <span>🔧 Assigned</span>}
      </div>
    </div>
  );
}
