import React, { useState } from 'react';
import AttachmentUploader from './AttachmentUploader';

const CATEGORIES = ['ELECTRICAL', 'PLUMBING', 'IT', 'FURNITURE', 'OTHER'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function TicketForm({ onSubmit, submitting = false }) {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    priority: 'MEDIUM',
    location: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!formData.category) errs.category = 'Category is required';
    if (!formData.description.trim()) errs.description = 'Description is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData, files);
  };

  const categoryEmojis = {
    ELECTRICAL: '⚡',
    PLUMBING: '🔧',
    IT: '💻',
    FURNITURE: '🪑',
    OTHER: '📋',
  };

  return (
    <form onSubmit={handleSubmit} id="ticket-create-form">
      <div className="card">
        <div className="card-header">
          <h3>Incident Details</h3>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label" htmlFor="ticket-title">Title *</label>
            <input
              id="ticket-title"
              className="form-input"
              name="title"
              placeholder="Brief description of the issue..."
              value={formData.title}
              onChange={handleChange}
            />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="ticket-category">Category *</label>
              <select
                id="ticket-category"
                className="form-select"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select category...</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{categoryEmojis[cat]} {cat}</option>
                ))}
              </select>
              {errors.category && <p className="form-error">{errors.category}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ticket-priority">Priority</label>
              <select
                id="ticket-priority"
                className="form-select"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ticket-description">Description *</label>
            <textarea
              id="ticket-description"
              className="form-textarea"
              name="description"
              placeholder="Provide a detailed description of the incident..."
              rows={5}
              value={formData.description}
              onChange={handleChange}
            />
            {errors.description && <p className="form-error">{errors.description}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ticket-location">Location</label>
            <input
              id="ticket-location"
              className="form-input"
              name="location"
              placeholder="e.g., Building A, Room 201"
              value={formData.location}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3>Contact Information</h3>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label" htmlFor="ticket-contact-name">Contact Name</label>
            <input
              id="ticket-contact-name"
              className="form-input"
              name="contactName"
              placeholder="Your name"
              value={formData.contactName}
              onChange={handleChange}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="ticket-contact-phone">Phone</label>
              <input
                id="ticket-contact-phone"
                className="form-input"
                name="contactPhone"
                placeholder="+94 7X XXX XXXX"
                value={formData.contactPhone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ticket-contact-email">Email</label>
              <input
                id="ticket-contact-email"
                className="form-input"
                name="contactEmail"
                placeholder="your@email.com"
                value={formData.contactEmail}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3>Attachments</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {files.length}/3 images
          </span>
        </div>
        <div className="card-body">
          <AttachmentUploader files={files} setFiles={setFiles} />
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} id="ticket-submit-btn">
          {submitting ? 'Submitting...' : '🎫 Submit Ticket'}
        </button>
      </div>
    </form>
  );
}
