import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { X, Send, Paperclip, Edit2, Trash2 } from 'lucide-react';

export const TicketDetailsModal = ({ ticket, onClose }) => {
    const { user } = useAuth();

    // Create mode state
    const [formData, setFormData] = useState({ 
        title: '', 
        description: '', 
        resourceName: '',
        resourceId: '',
        category: '',
        priority: 'MEDIUM',
        preferredContact: 'EMAIL'
    });
    const [resources, setResources] = useState([]);
    const [loadingResources, setLoadingResources] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [filePreviews, setFilePreviews] = useState([]);

    // View mode state
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [status, setStatus] = useState(ticket?.status || 'OPEN');
    
    // Status update details
    const [statusReason, setStatusReason] = useState('');
    const [pendingStatus, setPendingStatus] = useState('');

    // Comment edit details
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentText, setEditingCommentText] = useState('');

    useEffect(() => {
        if (!ticket?.isNew && ticket?.id) {
            fetchComments();
        } else if (ticket?.isNew) {
            // Fetch resources for the dropdown
            setLoadingResources(true);
            axios.get('/api/resources', { withCredentials: true })
                .then(res => {
                    console.log('Resources loaded for ticket:', res.data);
                    setResources(res.data);
                })
                .catch(err => {
                    console.error('Failed to fetch resources', err);
                    alert('Failed to load facilities. Please refresh the page.');
                })
                .finally(() => setLoadingResources(false));
        }
    }, [ticket]);

    const fetchComments = async () => {
        try {
            const res = await axios.get(`/api/tickets/${ticket.id}/comments`, { withCredentials: true });
            setComments(res.data);
        } catch (err) {
            console.error("Failed to fetch comments", err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!formData.title.trim()) {
            alert('Please enter a title');
            return;
        }
        if (!formData.description.trim()) {
            alert('Please enter a description');
            return;
        }
        
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title.trim());
            formDataToSend.append('description', formData.description.trim());
            
            // Only append resourceName and resourceId if they have values
            if (formData.resourceName && formData.resourceName.trim()) {
                formDataToSend.append('resourceName', formData.resourceName.trim());
            }
            if (formData.resourceId && formData.resourceId.trim()) {
                formDataToSend.append('resourceId', formData.resourceId.trim());
            }
            if (formData.category) formDataToSend.append('category', formData.category);
            if (formData.priority) formDataToSend.append('priority', formData.priority);
            if (formData.preferredContact) formDataToSend.append('preferredContact', formData.preferredContact);
            
            if (selectedFiles.length > 0) {
                selectedFiles.forEach(file => {
                    formDataToSend.append('images', file);
                });
            }

            console.log('Creating ticket with data:', {
                title: formData.title,
                description: formData.description,
                resourceName: formData.resourceName,
                resourceId: formData.resourceId,
                hasImage: selectedFiles.length > 0
            });

            const response = await axios.post('/api/tickets', formDataToSend, { 
                withCredentials: true
                // Don't manually set Content-Type - axios will add it with the correct boundary
            });
            
            console.log('Ticket created successfully:', response.data);
            alert('✅ Ticket created successfully!');
            onClose();
        } catch (err) {
            console.error('Ticket creation error:', err);
            console.error('Error response:', err.response);
            const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to create ticket. Please try again.';
            alert('❌ ' + (typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)));
        }
    };

    const handleStatusMenuChange = (e) => {
        const newStatus = e.target.value;
        setPendingStatus(newStatus);
        if (newStatus !== 'RESOLVED' && newStatus !== 'REJECTED') {
            handleStatusCommit(newStatus, '');
        }
    };

    const handleStatusCommit = async (commitStatus, reason) => {
        try {
            if (commitStatus === 'RESOLVED') {
                await axios.put(`/api/tickets/${ticket.id}/resolve`, { resolutionNotes: reason }, { withCredentials: true });
            } else {
                await axios.put(`/api/tickets/${ticket.id}/status`, { status: commitStatus, rejectionReason: reason }, { withCredentials: true });
            }
            setStatus(commitStatus);
            setPendingStatus('');
            setStatusReason('');
            onClose(); // Optional: or just show success msg
        } catch (err) {
            alert("Status update failed");
        }
    };

    const handleAssign = async (technicianId) => {
        try {
            await axios.patch(`/api/tickets/${ticket.id}/assign`, { technicianId }, { withCredentials: true });
            onClose();
        } catch (err) {
            alert("Assignment failed");
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await axios.post(`/api/tickets/${ticket.id}/comments`, { text: newComment }, { withCredentials: true });
            setNewComment('');
            fetchComments();
        } catch (err) {
            alert("Failed to add comment");
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Delete this comment?")) return;
        try {
            await axios.delete(`/api/tickets/comments/${commentId}`, { withCredentials: true });
            fetchComments();
        } catch (err) {
            alert("Failed to delete comment");
        }
    };

    const handleSaveEditComment = async (commentId) => {
        if (!editingCommentText.trim()) return;
        try {
            await axios.put(`/api/tickets/comments/${commentId}`, { text: editingCommentText }, { withCredentials: true });
            setEditingCommentId(null);
            setEditingCommentText('');
            fetchComments();
        } catch (err) {
            alert("Failed to edit comment");
        }
    };

    const handleFileChange = (e) => {
        let files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        if (selectedFiles.length + files.length > 3) {
            alert('You can only upload a maximum of 3 images.');
            files = files.slice(0, 3 - selectedFiles.length);
        }

        const validFiles = files.filter(file => {
            if (file.size > 5 * 1024 * 1024) {
                alert(`${file.name} is too large (max 5MB)`);
                return false;
            }
            if (!file.type.startsWith('image/')) {
                alert(`${file.name} is not an image`);
                return false;
            }
            return true;
        });

        setSelectedFiles(prev => [...prev, ...validFiles]);

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeFile = (indexToRemove) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== indexToRemove));
        setFilePreviews(prev => prev.filter((_, i) => i !== indexToRemove));
    };

    // --- Create Mode Form ---
    if (ticket?.isNew) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold">Raise New Issue</h2>
                        <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                    </div>
                    <form onSubmit={handleCreate} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Title *</label>
                            <input 
                                required 
                                type="text" 
                                value={formData.title} 
                                onChange={e => setFormData({ ...formData, title: e.target.value })} 
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="e.g., Projector not working" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Select Facility/Equipment (Optional)</label>
                            {loadingResources ? (
                                <div className="w-full p-2 border rounded-lg text-gray-500 text-sm">
                                    Loading facilities...
                                </div>
                            ) : (
                                <select 
                                    value={formData.resourceId} 
                                    onChange={e => {
                                        const selectedResource = resources.find(r => r.id === e.target.value);
                                        setFormData({ 
                                            ...formData, 
                                            resourceId: e.target.value,
                                            resourceName: selectedResource ? selectedResource.name : ''
                                        });
                                    }}
                                    className="w-full p-2 border rounded-lg outline-none"
                                >
                                    <option value="">General Campus Issue</option>
                                    {resources.map(r => (
                                        <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Description *</label>
                            <textarea 
                                required 
                                rows="3" 
                                value={formData.description} 
                                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                className="w-full p-2 border rounded-lg outline-none"
                                placeholder="Describe the issue in detail..."
                            ></textarea>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border rounded-lg outline-none">
                                    <option value="">General</option>
                                    <option value="ELECTRICAL">Electrical</option>
                                    <option value="PLUMBING">Plumbing</option>
                                    <option value="IT">IT / Network</option>
                                    <option value="HVAC">HVAC / AC</option>
                                    <option value="STRUCTURAL">Structural</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Priority</label>
                                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full p-2 border rounded-lg outline-none">
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Contact Via</label>
                                <select value={formData.preferredContact} onChange={e => setFormData({...formData, preferredContact: e.target.value})} className="w-full p-2 border rounded-lg outline-none">
                                    <option value="EMAIL">Email</option>
                                    <option value="PHONE">Phone</option>
                                    <option value="IN_PERSON">In Person</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* Attachment Upload */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Attach Image (Optional, Max 3)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition">
                                {filePreviews.length === 0 ? (
                                    <>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                            <Paperclip className="w-8 h-8 text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-600">Click to upload images</p>
                                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB (Max 3)</p>
                                        </label>
                                    </>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-wrap gap-4 justify-center">
                                            {filePreviews.map((preview, idx) => (
                                                <div key={idx} className="relative group">
                                                    <img src={preview} alt={`Preview ${idx + 1}`} className="max-h-32 object-cover rounded shadow-sm border border-gray-200" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(idx)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        {filePreviews.length < 3 && (
                                            <div>
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                    id="file-upload-more"
                                                />
                                                <label htmlFor="file-upload-more" className="cursor-pointer text-sm text-primary-600 font-medium hover:underline inline-flex items-center gap-1">
                                                    <Paperclip className="w-4 h-4" /> Add More
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-4">
                            <button 
                                type="button" 
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition"
                            >
                                Submit Ticket
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // --- View Mode Form ---
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">{ticket.title}</h2>
                            <p className="text-gray-500 text-sm">Opened by {ticket.creatorName} • {ticket.resourceName}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {(user.role === 'ADMIN' || user.role === 'TECHNICIAN') && (
                                <select value={pendingStatus || status} onChange={handleStatusMenuChange} className="text-sm border p-1 rounded font-medium bg-gray-50 outline-none">
                                    <option value="OPEN">Open</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="RESOLVED">Resolved</option>
                                    <option value="CLOSED">Closed</option>
                                    <option value="REJECTED">Rejected</option>
                                </select>
                            )}
                            {user.role === 'ADMIN' && (
                                <select
                                    onChange={(e) => handleAssign(e.target.value)}
                                    value={ticket.assignedTechnicianId || ''}
                                    className="text-sm border p-1 rounded font-medium bg-purple-50 text-purple-700 outline-none"
                                >
                                    <option value="" disabled>Assign Tech...</option>
                                    <option value="dev-tech-789">Campus Technician (dev-tech-789)</option>
                                </select>
                            )}
                            <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
                        </div>
                    </div>
                    
                    {(pendingStatus === 'RESOLVED' || pendingStatus === 'REJECTED') && (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex flex-col gap-2 mt-2">
                            <label className="text-sm font-semibold text-yellow-900">
                                {pendingStatus === 'RESOLVED' ? 'Resolution Notes' : 'Rejection Reason'}
                            </label>
                            <textarea
                                value={statusReason}
                                onChange={e => setStatusReason(e.target.value)}
                                className="w-full p-2 border rounded outline-none text-sm"
                                placeholder={pendingStatus === 'RESOLVED' ? 'What was done to fix this issue?' : 'Why is this ticket being rejected?'}
                            />
                            <div className="flex gap-2 justify-end mt-2">
                                <button onClick={() => setPendingStatus('')} className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300">Cancel</button>
                                <button onClick={() => handleStatusCommit(pendingStatus, statusReason)} className="px-3 py-1 bg-primary-600 text-white text-sm rounded cursor-pointer hover:bg-primary-700 transition">
                                    Apply Status
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 overflow-y-auto flex-grow space-y-6">
                    <div className="bg-blue-50 text-blue-900 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
                        {ticket.resolutionNotes && (
                            <div className="mt-4 pt-4 border-t border-blue-200">
                                <h4 className="font-semibold mb-1 text-green-700">Resolution Notes</h4>
                                <p className="whitespace-pre-wrap text-sm text-green-900">{ticket.resolutionNotes}</p>
                            </div>
                        )}
                        {ticket.rejectionReason && (
                            <div className="mt-4 pt-4 border-t border-blue-200">
                                <h4 className="font-semibold mb-1 text-red-700">Rejection Reason</h4>
                                <p className="whitespace-pre-wrap text-sm text-red-900">{ticket.rejectionReason}</p>
                            </div>
                        )}
                    </div>

                    {/* Display attached images if exist */}
                    {ticket.imageUrls && ticket.imageUrls.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                                <Paperclip className="w-4 h-4" />
                                Attachments ({ticket.imageUrls.length})
                            </h4>
                            <div className="flex flex-wrap gap-3">
                                {ticket.imageUrls.map((url, i) => (
                                    <img
                                        key={i}
                                        src={url}
                                        alt={`Attachment ${i + 1}`}
                                        className="max-h-40 rounded-lg shadow-sm border border-gray-300 cursor-pointer hover:opacity-90 transition"
                                        onClick={() => window.open(url, '_blank')}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-800 border-b pb-2">Comments ({comments.length})</h4>
                        <div className="space-y-4">
                            {comments.map(c => (
                                <div key={c.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors group">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex gap-2 items-center">
                                            <span className="font-medium text-sm text-gray-900">{c.authorName}</span>
                                            <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</span>
                                            {c.updatedAt && c.updatedAt !== c.createdAt && <span className="text-[10px] text-gray-400 italic">(edited)</span>}
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {user.id === c.authorId && (
                                                <button onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.text); }} className="text-gray-400 hover:text-blue-500" title="Edit">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {(user.id === c.authorId || user.role === 'ADMIN') && (
                                                <button onClick={() => handleDeleteComment(c.id)} className="text-gray-400 hover:text-red-500" title="Delete">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {editingCommentId === c.id ? (
                                        <div className="flex flex-col gap-2 mt-2">
                                            <textarea 
                                                value={editingCommentText} 
                                                onChange={e => setEditingCommentText(e.target.value)} 
                                                className="w-full text-sm p-2 border rounded outline-none" 
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingCommentId(null)} className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                                                <button onClick={() => handleSaveEditComment(c.id)} className="text-xs px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700">Save</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.text}</p>
                                    )}
                                </div>
                            ))}
                            {comments.length === 0 && <p className="text-sm text-gray-500 italic">No comments yet.</p>}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <form onSubmit={handleAddComment} className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-grow p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button type="submit" className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center justify-center">
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
