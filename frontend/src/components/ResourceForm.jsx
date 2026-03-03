import { useState } from 'react';
import axios from '../api/axios';
import { X } from 'lucide-react';

export const ResourceForm = ({ resource, onClose }) => {
    const [formData, setFormData] = useState({
        name: resource?.name || '',
        type: resource?.type || 'LECTURE_HALL',
        capacity: resource?.capacity || 1,
        location: resource?.location || '',
        status: resource?.status || 'ACTIVE',
        description: resource?.description || '',
        imageUrl: resource?.imageUrl || ''
    });

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        // Ensure all required fields are filled and properly formatted
        const payload = {
            name: (formData.name || '').trim(),
            type: formData.type || 'LECTURE_HALL',
            capacity: parseInt(formData.capacity) || 1,
            location: (formData.location || '').trim(),
            status: formData.status || 'ACTIVE',
            description: (formData.description || '').trim(),
            imageUrl: (formData.imageUrl || '').trim()
        };
        
        // Validate required fields
        if (!payload.name || !payload.type || !payload.location || !payload.status) {
            alert('Please fill all required fields: Name, Type, Location, and Status');
            setLoading(false);
            return;
        }
        
        console.log('=== RESOURCE FORM SUBMISSION ===');
        console.log('Form Data:', formData);
        console.log('Payload being sent:', JSON.stringify(payload, null, 2));
        
        try {
            let response;
            if (resource?.id) {
                console.log('Updating resource ID:', resource.id);
                response = await axios.put(`/api/resources/${resource.id}`, payload, { withCredentials: true });
            } else {
                console.log('Creating new resource...');
                response = await axios.post(`/api/resources`, payload, { withCredentials: true });
            }
            console.log('Success! Response:', response.data);
            alert('Resource saved successfully!');
            onClose();
            window.location.reload(); // Refresh to show new resource
        } catch (err) {
            console.error('=== ERROR SAVING RESOURCE ===');
            console.error('Full error:', err);
            console.error('Error response:', err.response);
            console.error('Error data:', err.response?.data);
            console.error('Error status:', err.response?.status);
            
            const errorMsg = err.response?.data?.error 
                || err.response?.data?.message 
                || (err.response?.data ? JSON.stringify(err.response.data) : '')
                || err.message
                || 'Failed to save resource. Please check all required fields.';
            alert('Error: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        {resource ? 'Edit Resource' : 'Add New Resource'}
                    </h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g., Main Auditorium" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                                <option value="LECTURE_HALL">Lecture Hall</option>
                                <option value="LAB">Lab</option>
                                <option value="EQUIPMENT">Equipment</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                            <input required type="number" min="1" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="50" />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                            <input required type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g., Building A, Floor 2" />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                                <option value="ACTIVE">Active</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g., Large auditorium with projector and sound system"></textarea>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                            <input type="url" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="https://images.unsplash.com/photo-1523580494863-6f3031224c94" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Resource'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
