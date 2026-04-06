import React, { useState } from 'react';
import { Send, Edit3, Trash2, X, Check } from 'lucide-react';
import * as ticketService from '../../services/ticketService';

export default function CommentSection({ ticketId, comments, onCommentsChange }) {
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentUserId = localStorage.getItem('mockUserId') || '00000000-0000-0000-0000-000000000001';

  const handleAdd = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await ticketService.addComment(ticketId, { content: newComment.trim(), internal: false });
      setNewComment('');
      onCommentsChange();
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (commentId) => {
    if (!editContent.trim()) return;
    try {
      await ticketService.editComment(ticketId, commentId, { content: editContent.trim(), internal: false });
      setEditingId(null);
      setEditContent('');
      onCommentsChange();
    } catch (err) {
      console.error('Failed to edit comment:', err);
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await ticketService.deleteComment(ticketId, commentId);
      onCommentsChange();
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

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

  const getInitials = (id) => {
    const str = id?.toString() || '';
    return str.substring(0, 2).toUpperCase();
  };

  return (
    <div>
      <h3 className="section-title">
        <MessageSquareIcon /> Comments ({comments?.length || 0})
      </h3>

      {/* Add Comment */}
      <div className="comment-input-wrapper" style={{ marginBottom: '1.5rem' }}>
        <div className="comment-avatar">{getInitials(currentUserId)}</div>
        <textarea
          className="form-textarea"
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd();
          }}
          id="comment-input"
        />
        <button
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={!newComment.trim() || submitting}
          id="comment-submit"
        >
          <Send size={16} />
        </button>
      </div>

      {/* Comment Thread */}
      <div className="comment-thread">
        {(!comments || comments.length === 0) && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
            No comments yet. Be the first to comment.
          </p>
        )}

        {comments?.map((comment) => (
          <div key={comment.id} className="comment-item" id={`comment-${comment.id}`}>
            <div className="comment-avatar">{getInitials(comment.authorId)}</div>
            <div className="comment-content">
              <div className="comment-header">
                <span className="comment-author">
                  {comment.authorId === currentUserId ? 'You' : `User ${comment.authorId?.substring(0, 8)}`}
                </span>
                <span className="comment-time">{formatDate(comment.createdAt)}</span>
              </div>

              {editingId === comment.id ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginTop: '0.25rem' }}>
                  <textarea
                    className="form-textarea"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    style={{ minHeight: '50px' }}
                  />
                  <button className="btn btn-ghost" onClick={() => handleEdit(comment.id)}>
                    <Check size={16} />
                  </button>
                  <button className="btn btn-ghost" onClick={() => setEditingId(null)}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <p className="comment-text">{comment.content}</p>
                  {comment.authorId === currentUserId && (
                    <div className="comment-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => startEdit(comment)}
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(comment.id)}
                        title="Delete"
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageSquareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
