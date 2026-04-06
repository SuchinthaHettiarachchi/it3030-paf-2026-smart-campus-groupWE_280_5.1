import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Ticket, RefreshCw } from 'lucide-react';
import TicketCard from '../../components/ticket/TicketCard';
import * as ticketService from '../../services/ticketService';

const STATUS_TABS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

export default function TicketListPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await ticketService.getMyTickets();
      setTickets(res.data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = activeTab === 'ALL'
    ? tickets
    : tickets.filter(t => t.status === activeTab);

  const statusCounts = STATUS_TABS.reduce((acc, status) => {
    acc[status] = status === 'ALL'
      ? tickets.length
      : tickets.filter(t => t.status === status).length;
    return acc;
  }, {});

  return (
    <>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>My Tickets</h1>
            <p>Track and manage your incident reports</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={fetchTickets} title="Refresh">
              <RefreshCw size={16} />
            </button>
            <Link to="/tickets/create" className="btn btn-primary" id="create-ticket-btn">
              <Plus size={16} /> New Ticket
            </Link>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Filter Tabs */}
        <div className="filter-tabs" style={{ marginBottom: '1.5rem' }}>
          {STATUS_TABS.map(status => (
            <button
              key={status}
              className={`filter-tab ${activeTab === status ? 'active' : ''}`}
              onClick={() => setActiveTab(status)}
              id={`filter-tab-${status.toLowerCase()}`}
            >
              {status === 'ALL' ? 'All' : status.replace('_', ' ')}
              <span style={{
                marginLeft: '0.3rem',
                opacity: 0.7,
                fontSize: '0.7rem',
              }}>
                {statusCounts[status]}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="empty-state">
            <Ticket size={64} className="empty-state-icon" />
            <h3>No tickets found</h3>
            <p>
              {activeTab === 'ALL'
                ? "You haven't submitted any incident reports yet."
                : `No tickets with status "${activeTab.replace('_', ' ')}".`}
            </p>
            <Link to="/tickets/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              <Plus size={16} /> Create Your First Ticket
            </Link>
          </div>
        ) : (
          <div className="ticket-grid">
            {filteredTickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
