import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye, Settings, UserPlus } from 'lucide-react';
import TicketStatusBadge from '../../components/ticket/TicketStatusBadge';
import TicketPriorityBadge from '../../components/ticket/TicketPriorityBadge';
import StatusUpdateModal from '../../components/ticket/StatusUpdateModal';
import * as ticketService from '../../services/ticketService';

const CATEGORIES = ['', 'ELECTRICAL', 'PLUMBING', 'IT', 'FURNITURE', 'OTHER'];
const PRIORITIES = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

export default function AdminTicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', category: '' });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [assignModalTicket, setAssignModalTicket] = useState(null);
  const [technicianId, setTechnicianId] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.category) params.category = filters.category;
      const res = await ticketService.getAllTickets(params);
      setTickets(res.data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const handleStatusUpdate = async (data) => {
    await ticketService.updateTicketStatus(selectedTicket.id, data);
    await fetchTickets();
  };

  const handleAssign = async () => {
    if (!technicianId.trim()) return;
    try {
      await ticketService.assignTechnician(assignModalTicket.id, technicianId.trim());
      setAssignModalTicket(null);
      setTechnicianId('');
      await fetchTickets();
    } catch (err) {
      console.error('Failed to assign technician:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>All Tickets</h1>
            <p>Admin & Technician view — manage all incident reports</p>
          </div>
          <button className="btn btn-secondary" onClick={fetchTickets}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="filters-bar">
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '140px' }}
            value={filters.status}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
            id="filter-status"
          >
            <option value="">All Statuses</option>
            {STATUSES.filter(Boolean).map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '140px' }}
            value={filters.priority}
            onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}
            id="filter-priority"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.filter(Boolean).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '140px' }}
            value={filters.category}
            onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
            id="filter-category"
          >
            <option value="">All Categories</option>
            {CATEGORIES.filter(Boolean).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {(filters.status || filters.priority || filters.category) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setFilters({ status: '', priority: '', category: '' })}
            >
              Clear Filters
            </button>
          )}

          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <h3>No tickets match your filters</h3>
            <p>Try adjusting your filter criteria.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table" id="admin-tickets-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id} id={`admin-ticket-row-${ticket.id}`}>
                    <td>
                      <div className="table-title">{ticket.title}</div>
                      <div className="table-subtitle">
                        Reported by: {ticket.reportedBy?.substring(0, 8)}...
                      </div>
                    </td>
                    <td><TicketStatusBadge status={ticket.status} /></td>
                    <td><TicketPriorityBadge priority={ticket.priority} /></td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {ticket.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {ticket.location || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatDate(ticket.createdAt)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowStatusModal(true);
                          }}
                          title="Update Status"
                        >
                          <Settings size={16} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setAssignModalTicket(ticket)}
                          title="Assign Technician"
                        >
                          <UserPlus size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedTicket && (
        <StatusUpdateModal
          ticket={selectedTicket}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedTicket(null);
          }}
          onUpdate={handleStatusUpdate}
        />
      )}

      {/* Assign Technician Modal */}
      {assignModalTicket && (
        <div className="modal-overlay" onClick={() => setAssignModalTicket(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Technician</h3>
              <button className="btn btn-ghost" onClick={() => setAssignModalTicket(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Assign a technician to: <strong style={{ color: 'var(--text-primary)' }}>{assignModalTicket.title}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Technician User ID</label>
                <input
                  className="form-input"
                  placeholder="Enter technician UUID..."
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  id="technician-id-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAssignModalTicket(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign} id="assign-submit-btn">
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
