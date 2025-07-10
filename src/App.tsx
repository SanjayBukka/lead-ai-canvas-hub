
import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import LeadForm from './components/LeadForm';
import LeadUpload from './components/LeadUpload';
import LeadTable from './components/LeadTable';
import LeadModal from './components/LeadModal';
import ReactFlowCanvas from './components/ReactFlowCanvas';
import axios from 'axios';
import toast from 'react-hot-toast';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'New' | 'Contacted';
  source: 'Manual' | 'Document';
  createdAt: string;
}

const App = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'leads' | 'workflow'>('leads');
  const [loading, setLoading] = useState(false);

  // API Base URL - Update this to your backend URL
  const API_BASE = 'http://localhost:3001/api';

  // Fetch leads from backend
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/leads`);
      setLeads(response.data);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  // Add new lead
  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    try {
      const response = await axios.post(`${API_BASE}/leads`, leadData);
      setLeads(prev => [...prev, response.data]);
      toast.success('Lead added successfully!');
    } catch (error) {
      console.error('Error adding lead:', error);
      toast.error('Failed to add lead');
    }
  };

  // Update lead
  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      const response = await axios.put(`${API_BASE}/leads/${id}`, updates);
      setLeads(prev => prev.map(lead => 
        lead.id === id ? response.data : lead
      ));
      toast.success('Lead updated successfully!');
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
    }
  };

  // Delete lead
  const deleteLead = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/leads/${id}`);
      setLeads(prev => prev.filter(lead => lead.id !== id));
      toast.success('Lead deleted successfully!');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  // Send email to lead
  const sendEmail = async (leadId: string, subject: string, message: string) => {
    try {
      await axios.post(`${API_BASE}/leads/${leadId}/email`, {
        subject,
        message
      });
      toast.success('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    }
  };

  // Handle file upload and OCR processing
  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_BASE}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const extractedData = response.data;
      
      // Add extracted leads
      for (const leadData of extractedData.leads) {
        await addLead({
          ...leadData,
          source: 'Document',
          status: 'New'
        });
      }
      
      toast.success(`Extracted ${extractedData.leads.length} leads from document`);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file');
    }
  };

  // Open lead modal
  const openLeadModal = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  // Close lead modal
  const closeLeadModal = () => {
    setSelectedLead(null);
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster position="top-right" />
      
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        totalLeads={leads.length}
        newLeads={leads.filter(lead => lead.status === 'New').length}
      />
      
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'leads' ? (
          <div className="space-y-8">
            {/* Lead Management Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <LeadForm onSubmit={addLead} />
                <LeadUpload onFileUpload={handleFileUpload} />
              </div>
              
              <div className="lg:col-span-2">
                <LeadTable 
                  leads={leads}
                  onViewLead={openLeadModal}
                  onUpdateLead={updateLead}
                  onDeleteLead={deleteLead}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Workflow Canvas Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Lead Workflow Automation
              </h2>
              <ReactFlowCanvas leads={leads} onSendEmail={sendEmail} />
            </div>
          </div>
        )}
      </div>

      {/* Lead Detail Modal */}
      {isModalOpen && selectedLead && (
        <LeadModal
          lead={selectedLead}
          isOpen={isModalOpen}
          onClose={closeLeadModal}
          onSendEmail={sendEmail}
          onUpdateLead={updateLead}
        />
      )}
    </div>
  );
};

export default App;
