import { useState } from 'react';
import { addComment, editComment, deleteComment } from '../../services/ticketService';
import toast from 'react-hot-toast';

/**
 * CommentSection
 * Props:
 *  - ticketId: string
 *  - comments: CommentResponseDTO[]
 *  - currentUserId: string | null
 *  - isAdminOrTech: boolean
 *  - onRefresh: () => void
 */
export default function CommentSection({ ticketId, comments = [], currentUserId, isAdminOrTech, onRefresh }) {
  const [content, setContent]         = useState('');
  const [isInternal, setIsInternal]   = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [editContent, setEditContent] = useState('');

  const fmt = (d) => d ? new Date(d).toLocaleString() : '';

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await addComment(ticketId, { content, internal: isInternal });
      setContent('');
      setIsInternal(false);
      toast.success('Comment added');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (comment) => {
    try {
      await editComment(ticketId, comment.id, { content: editContent, internal: comment.internal });
      setEditingId(null);
      toast.success('Comment updated');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to update comment');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(ticketId, commentId);
      toast.success('Comment deleted');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to delete comment');
    }
  };

  const visibleComments = comments.filter(
    (c) => !c.internal || isAdminOrTech
  );

  return (
    <section style={{ marginTop: '2rem' }}>
      <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>
        💬 Comments ({visibleComments.length})
      </h3>

      {/* Comment list */}
      <div className="comment-list">
        {visibleComments.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>No comments yet.</p>
        )}
        {visibleComments.map((c) => {
          const isOwn = c.authorId === currentUserId;
          const canAct = isOwn || isAdminOrTech;
          return (
            <div key={c.id} className="comment-item" id={`comment-${c.id}`}>
              <div className="comment-header">
                <span className="comment-author">
                  {c.authorId?.slice(0, 8) ?? 'User'}…
                </span>
                <span>{fmt(c.createdAt)}</span>
                {c.internal && <span className="comment-internal">Internal</span>}
              </div>

              {editingId === c.id ? (
                <div>
                  <textarea
                    className="form-control"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    style={{ minHeight: '70px', marginBottom: '.5rem' }}
                    id={`edit-comment-input-${c.id}`}
                  />
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleEdit(c)}>Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '.875rem', lineHeight: 1.6 }}>{c.content}</p>
              )}

              {canAct && editingId !== c.id && (
                <div className="comment-actions">
                  {isOwn && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setEditingId(c.id); setEditContent(c.content); }}
                      id={`edit-comment-btn-${c.id}`}
                    >✏️</button>
                  )}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(c.id)}
                    id={`delete-comment-btn-${c.id}`}
                  >🗑️</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleAdd} style={{ marginTop: '1.5rem' }}>
        <div className="form-group">
          <label className="form-label">Add Comment</label>
          <textarea
            className="form-control"
            placeholder="Write your comment…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            id="new-comment-input"
          />
        </div>

        {isAdminOrTech && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              id="comment-internal-checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
            />
            <label htmlFor="comment-internal-checkbox" style={{ fontSize: '.85rem', cursor: 'pointer' }}>
              Internal note (staff/admin only)
            </label>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          id="submit-comment-btn"
        >
          {submitting ? 'Posting…' : 'Post Comment'}
        </button>
      </form>
    </section>
  );
}
