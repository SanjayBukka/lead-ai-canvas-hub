
import React from 'react';
import { Eye, Edit, Trash2, Mail, Phone, Calendar, Loader } from 'lucide-react';
import { Lead } from '../App';

interface LeadTableProps {
  leads: Lead[];
  onViewLead: (lead: Lead) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onDeleteLead: (id: string) => void;
  loading: boolean;
}

const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  onViewLead,
  onUpdateLead,
  onDeleteLead,
  loading
}) => {
  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    return status === 'New'
      ? `${baseClasses} bg-green-100 text-green-800`
      : `${baseClasses} bg-blue-100 text-blue-800`;
  };

  const getSourceBadge = (source: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    return source === 'Manual'
      ? `${baseClasses} bg-purple-100 text-purple-800`
      : `${baseClasses} bg-orange-100 text-orange-800`;
  };

  const handleStatusChange = (leadId: string, newStatus: 'New' | 'Contacted') => {
    onUpdateLead(leadId, { status: newStatus });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">Loading leads...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          Lead Management ({leads.length} leads)
        </h2>
      </div>

      {leads.length === 0 ? (
        <div className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Mail className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No leads yet</h3>
          <p className="text-gray-500">
            Add your first lead using the form or upload a document
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {lead.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-3 h-3 mr-1" />
                        {lead.email}
                      </div>
                      {lead.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-3 h-3 mr-1" />
                          {lead.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as 'New' | 'Contacted')}
                      className={`${getStatusBadge(lead.status)} border-none outline-none cursor-pointer`}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getSourceBadge(lead.source)}>
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onViewLead(lead)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteLead(lead.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeadTable;
