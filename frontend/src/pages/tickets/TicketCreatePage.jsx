import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TicketForm from '../../components/ticket/TicketForm';
import * as ticketService from '../../services/ticketService';

export default function TicketCreatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (formData, files) => {
    setSubmitting(true);
    try {
      // 1. Create the ticket
      const res = await ticketService.createTicket(formData);
      const ticketId = res.data.id;

      // 2. Upload attachments if any
      for (const file of files) {
        try {
          await ticketService.uploadAttachment(ticketId, file);
        } catch (err) {
          console.error('Failed to upload attachment:', err);
        }
      }

      setToast({ type: 'success', message: 'Ticket created successfully!' });
      setTimeout(() => navigate(`/tickets/${ticketId}`), 1000);
    } catch (err) {
      console.error('Failed to create ticket:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.message || 'Failed to create ticket',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate('/tickets')}>
            <ArrowLeft size={16} /> Back to My Tickets
          </button>
          <h1>Report an Incident</h1>
          <p>Submit a new maintenance or incident ticket</p>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: '800px' }}>
        <TicketForm onSubmit={handleSubmit} submitting={submitting} />
      </div>

      {toast && (
        <div
          className={`toast toast-${toast.type}`}
          onClick={() => setToast(null)}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}
