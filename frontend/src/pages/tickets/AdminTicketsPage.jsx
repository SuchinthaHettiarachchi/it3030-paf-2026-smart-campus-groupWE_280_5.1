import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTickets, assignTechnician } from '../../services/ticketService';
import TicketStatusBadge   from '../../components/ticket/TicketStatusBadge.jsx';
import TicketPriorityBadge from '../../components/ticket/TicketPriorityBadge.jsx';
import StatusUpdateModal   from '../../components/ticket/StatusUpdateModal.jsx';
import toast from 'react-hot-toast';

const STATUSES   = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];
const PRIORITIES = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const CATEGORIES = ['', 'ELECTRICAL', 'PLUMBING', 'IT', 'FURNITURE', 'OTHER'];
const PAGE_SIZE  = 10;

export default function AdminTicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filters, setFilters]         = useState({ status: '', priority: '', category: '' });
  const [page, setPage]               = useState(0);
  const [modalTicket, setModalTicket] = useState(null);
  const [assignTarget, setAssignTarget] = useState({});  // { [ticketId]: technicianId }

  const setFilter = (k) => (e) => setFilters((p) => ({ ...p, [k]: e.target.value }));

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filters.status)   params.status   = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.category) params.category = filters.category;

    getAllTickets(params)
      .then((res) => setTickets(res.data))
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); setPage(0); }, [load]);

  const handleAssign = async (ticketId) => {
    const techId = assignTarget[ticketId];
    if (!techId?.trim()) return toast.error('Enter a valid technician UUID');
    try {
      await assignTechnician(ticketId, techId.trim());
      toast.success('Technician assigned');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to assign');
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString() : '—';
  const paginated = tickets.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(tickets.length / PAGE_SIZE);

  return (
    <main className="page-shell">
      <div className="page-header">
        <h1 className="page-title">All Tickets</h1>
        <span style={{ color: 'var(--text-muted)', fontSize: '.875rem' }}>
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <select
          className="form-control"
          value={filters.status}
          onChange={setFilter('status')}
          id="filter-status"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        <select
          className="form-control"
          value={filters.priority}
          onChange={setFilter('priority')}
          id="filter-priority"
        >
          {PRIORITIES.map((p) => <option key={p} value={p}>{p || 'All Priorities'}</option>)}
        </select>
        <select
          className="form-control"
          value={filters.category}
          onChange={setFilter('category')}
          id="filter-category"
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c || 'All Categories'}</option>)}
        </select>
        <button className="btn btn-ghost" onClick={load} id="refresh-btn">↻ Refresh</button>
      </div>

      {loading && <div className="spinner" />}

      {!loading && tickets.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: '3rem' }}>📭</div>
          <h3>No tickets match the filters</h3>
          <p>Try clearing the filters above.</p>
        </div>
      )}

      {!loading && tickets.length > 0 && (
        <>
          <div className="table-wrap card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Reported</th>
                  <th>Assign Technician</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((t) => (
                  <tr key={t.id} id={`admin-ticket-row-${t.id}`}>
                    <td>
                      <span
                        style={{ cursor: 'pointer', fontWeight: 500 }}
                        onClick={() => navigate(`/tickets/${t.id}`)}
                        title="View ticket"
                      >
                        {t.title.length > 40 ? t.title.slice(0, 40) + '…' : t.title}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>{t.category}</td>
                    <td><TicketStatusBadge status={t.status} /></td>
                    <td><TicketPriorityBadge priority={t.priority} /></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '.82rem' }}>{fmt(t.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '.4rem' }}>
                        <input
                          className="form-control"
                          style={{ width: 140, padding: '.3rem .5rem', fontSize: '.78rem' }}
                          placeholder="Technician UUID"
                          value={assignTarget[t.id] ?? ''}
                          onChange={(e) => setAssignTarget((p) => ({ ...p, [t.id]: e.target.value }))}
                          id={`assign-input-${t.id}`}
                        />
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleAssign(t.id)}
                          id={`assign-btn-${t.id}`}
                        >Assign</button>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setModalTicket(t)}
                        id={`status-btn-${t.id}`}
                      >Status</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '.5rem', marginTop: '1.25rem' }}>
              <button
                className="btn btn-ghost btn-sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                id="prev-page-btn"
              >← Prev</button>
              <span style={{ padding: '.35rem .8rem', color: 'var(--text-muted)', fontSize: '.875rem' }}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                id="next-page-btn"
              >Next →</button>
            </div>
          )}
        </>
      )}

      {modalTicket && (
        <StatusUpdateModal
          ticket={modalTicket}
          onClose={() => setModalTicket(null)}
          onSuccess={() => { setModalTicket(null); load(); }}
        />
      )}
    </main>
  );
}
