import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTickets } from '../../services/ticketService';
import TicketCard from '../../components/ticket/TicketCard.jsx';
import toast from 'react-hot-toast';

export default function TicketListPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMyTickets()
      .then((res) => setTickets(res.data))
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="page-shell">
      <div className="page-header">
        <h1 className="page-title">My Tickets</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/tickets/new')}
          id="create-ticket-btn"
        >
          + Report Incident
        </button>
      </div>

      {loading && <div className="spinner" aria-label="Loading tickets" />}

      {!loading && tickets.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎫</div>
          <h3>No tickets yet</h3>
          <p>You haven't reported any incidents. Click "Report Incident" to get started.</p>
        </div>
      )}

      {!loading && tickets.length > 0 && (
        <div className="grid-tickets">
          {tickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
        </div>
      )}
    </main>
  );
}
