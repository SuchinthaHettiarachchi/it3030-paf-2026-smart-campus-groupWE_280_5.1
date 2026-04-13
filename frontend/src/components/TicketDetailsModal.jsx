import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { X, Send, Paperclip } from 'lucide-react';

export const TicketDetailsModal = ({ ticket, onClose }) => {
    const { user } = useAuth();

    // Create mode state
    const [formData, setFormData] = useState({ 
        title: '', 
        description: '', 
        resourceName: '',
        resourceId: '' 
    });
    const [resources, setResources] = useState([]);
    const [loadingResources, setLoadingResources] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);

    // View mode state
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [status, setStatus] = useState(ticket?.status || 'OPEN');

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
            
            if (selectedFile) {
                formDataToSend.append('image', selectedFile);
            }

            console.log('Creating ticket with data:', {
                title: formData.title,
                description: formData.description,
                resourceName: formData.resourceName,
                resourceId: formData.resourceId,
                hasImage: !!selectedFile
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

    const handleStatusUpdate = async (e) => {
        const newStatus = e.target.value;
        setStatus(newStatus);
        try {
            await axios.put(`/api/tickets/${ticket.id}/status`, { status: newStatus }, { withCredentials: true });
            onClose();
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
            }
            
            // Validate file type (images only)
            if (!file.type.startsWith('image/')) {
                alert('Only image files are allowed');
                return;
            }
            
            setSelectedFile(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
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
                                rows="4" 
                                value={formData.description} 
                                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                className="w-full p-2 border rounded-lg outline-none"
                                placeholder="Describe the issue in detail..."
                            ></textarea>
                        </div>
                        
                        {/* Attachment Upload */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Attach Image (Optional)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition">
                                {!filePreview ? (
                                    <>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label htmlFor="file-upload" className="cursor-pointer">
                                            <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600">Click to upload image</p>
                                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                                        </label>
                                    </>
                                ) : (
                                    <div className="relative">
                                        <img src={filePreview} alt="Preview" className="max-h-40 mx-auto rounded" />
                                        <button
                                            type="button"
                                            onClick={removeFile}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <p className="text-sm text-gray-600 mt-2">{selectedFile.name}</p>
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
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">{ticket.title}</h2>
                        <p className="text-gray-500 text-sm">Opened by {ticket.creatorName} • {ticket.resourceName}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {(user.role === 'ADMIN' || user.role === 'TECHNICIAN') && (
                            <select value={status} onChange={handleStatusUpdate} className="text-sm border p-1 rounded font-medium bg-gray-50 outline-none">
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

                <div className="p-6 overflow-y-auto flex-grow space-y-6">
                    <div className="bg-blue-50 text-blue-900 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
                    </div>

                    {/* Display attached image if exists */}
                    {ticket.imageUrl && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                                <Paperclip className="w-4 h-4" />
                                Attachment
                            </h4>
                            <img 
                                src={ticket.imageUrl} 
                                alt="Ticket attachment" 
                                className="max-w-full rounded-lg shadow-sm border border-gray-300 cursor-pointer hover:opacity-90 transition"
                                onClick={() => window.open(ticket.imageUrl, '_blank')}
                            />
                        </div>
                    )}

                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-800 border-b pb-2">Comments ({comments.length})</h4>
                        <div className="space-y-4">
                            {comments.map(c => (
                                <div key={c.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium text-sm text-gray-900">{c.authorName}</span>
                                        <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-700">{c.text}</p>
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
