
import React, { useState } from 'react';
import { Plus, User, Mail, Phone } from 'lucide-react';
import { Lead } from '../App';

interface LeadFormProps {
  onSubmit: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'New' as const,
    source: 'Manual' as const
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      onSubmit(formData);
      setFormData({
        name: '',
        email: '',
        phone: '',
        status: 'New',
        source: 'Manual'
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Plus className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Add New Lead</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter full name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-1" />
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter email address"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-1" />
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-md hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Lead</span>
        </button>
      </form>
    </div>
  );
};

export default LeadForm;
