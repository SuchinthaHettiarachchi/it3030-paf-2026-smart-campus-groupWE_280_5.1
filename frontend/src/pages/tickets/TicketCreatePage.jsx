import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket, uploadAttachment } from '../../services/ticketService';
import AttachmentUploader from '../../components/ticket/AttachmentUploader.jsx';
import toast from 'react-hot-toast';

const CATEGORIES = ['ELECTRICAL', 'PLUMBING', 'IT', 'FURNITURE', 'OTHER'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const initialForm = {
  title: '', category: 'IT', description: '', priority: 'MEDIUM',
  location: '', contactName: '', contactPhone: '', contactEmail: '',
  resourceId: '',
};

export default function TicketCreatePage() {
  const navigate  = useNavigate();
  const [form, setForm]     = useState(initialForm);
  const [files, setFiles]   = useState([]);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.resourceId) delete payload.resourceId;

      const res = await createTicket(payload);
      const ticketId = res.data.id;

      // Upload attachments sequentially
      for (const file of files) {
        try { await uploadAttachment(ticketId, file); }
        catch { toast.error(`Failed to upload ${file.name}`); }
      }

      toast.success('Ticket submitted!');
      navigate(`/tickets/${ticketId}`);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Report an Incident</h1>
        <button className="btn btn-ghost" onClick={() => navigate('/tickets')} id="back-to-tickets-btn">
          ← Back
        </button>
      </div>

      <div style={{ maxWidth: 760 }}>
        <form onSubmit={handleSubmit} className="card">

          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="ticket-title">Title *</label>
            <input
              id="ticket-title"
              className="form-control"
              placeholder="Brief description of the incident"
              value={form.title}
              onChange={set('title')}
              required
            />
          </div>

          {/* Category + Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="ticket-category">Category *</label>
              <select id="ticket-category" className="form-control" value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ticket-priority">Priority</label>
              <select id="ticket-priority" className="form-control" value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="ticket-description">Description *</label>
            <textarea
              id="ticket-description"
              className="form-control"
              placeholder="Provide as much detail as possible about the issue…"
              value={form.description}
              onChange={set('description')}
              required
              style={{ minHeight: 120 }}
            />
          </div>

          {/* Location + Resource */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="ticket-location">Location</label>
              <input
                id="ticket-location"
                className="form-control"
                placeholder="e.g. Lab 3 – Building A"
                value={form.location}
                onChange={set('location')}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ticket-resource">Resource ID (optional)</label>
              <input
                id="ticket-resource"
                className="form-control"
                placeholder="UUID of the related resource"
                value={form.resourceId}
                onChange={set('resourceId')}
              />
            </div>
          </div>

          {/* Contact info */}
          <p style={{ color: 'var(--text-muted)', fontSize: '.8rem', marginBottom: '.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Contact Information
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            {[
              { id: 'contact-name',  k: 'contactName',  placeholder: 'Full name' },
              { id: 'contact-phone', k: 'contactPhone', placeholder: 'Phone number' },
              { id: 'contact-email', k: 'contactEmail', placeholder: 'Email address' },
            ].map(({ id, k, placeholder }) => (
              <div key={k} className="form-group">
                <label className="form-label" htmlFor={id}>{placeholder}</label>
                <input id={id} className="form-control" placeholder={placeholder} value={form[k]} onChange={set(k)} />
              </div>
            ))}
          </div>

          {/* Attachments */}
          <div className="form-group" style={{ marginTop: '.5rem' }}>
            <label className="form-label">Attachments (up to 3 images)</label>
            <AttachmentUploader files={files} onChange={setFiles} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '.5rem', justifyContent: 'center', padding: '.75rem' }}
            id="submit-ticket-btn"
          >
            {loading ? 'Submitting…' : '🎫 Submit Ticket'}
          </button>
        </form>
      </div>
    </main>
  );
}
