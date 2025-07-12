import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import LeadForm from './components/LeadForm';
import LeadUpload from './components/LeadUpload';
import LeadTable from './components/LeadTable';
import LeadModal from './components/LeadModal';
import ReactFlowCanvas from './components/ReactFlowCanvas';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'New' | 'Contacted';
  source: 'Manual' | 'Document';
  createdAt: string;
}

const App: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'leads' | 'workflow'>('leads');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const fetchLeads = async () => {
    try {
      console.log('Fetching leads from backend...');
      setIsLoading(true);
      const response = await axios.get('http://localhost:3001/api/leads', {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Leads fetched successfully:', response.data);
      setLeads(response.data);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch leads';
      setError(`Backend connection failed: ${errorMessage}`);
      toast.error(`Failed to fetch leads: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    try {
      console.log('Adding new lead:', leadData);
      setIsLoading(true);
      
      const response = await axios.post('http://localhost:3001/api/leads', leadData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Lead added successfully:', response.data);
      await fetchLeads();
      toast.success('Lead added successfully!');
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error adding lead:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add lead';
      
      if (error.response?.status === 409) {
        toast.error('A lead with this email already exists!', { duration: 4000 });
      } else if (error.response?.status === 400) {
        toast.error(`Validation error: ${errorMessage}`, { duration: 4000 });
      } else {
        toast.error(`Failed to add lead: ${errorMessage}`, { duration: 4000 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateLead = async (id: string, leadData: Partial<Lead>) => {
    try {
      console.log('Updating lead:', id, leadData);
      setIsLoading(true);
      
      const response = await axios.put(`http://localhost:3001/api/leads/${id}`, leadData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Lead updated successfully:', response.data);
      await fetchLeads();
      toast.success('Lead updated successfully!');
    } catch (error: any) {
      console.error('Error updating lead:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update lead';
      toast.error(`Failed to update lead: ${errorMessage}`, { duration: 4000 });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLead = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    try {
      console.log('Deleting lead:', id);
      setIsLoading(true);
      
      await axios.delete(`http://localhost:3001/api/leads/${id}`, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Lead deleted successfully');
      await fetchLeads();
      toast.success('Lead deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete lead';
      toast.error(`Failed to delete lead: ${errorMessage}`, { duration: 4000 });
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmail = async (leadId: string, subject: string, message: string) => {
    try {
      console.log('Sending email to lead:', leadId);
      setIsLoading(true);
      
      const response = await axios.post(`http://localhost:3001/api/leads/${leadId}/email`, {
        subject,
        message
      }, {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Email sent successfully:', response.data);
      await fetchLeads();
      toast.success('Email sent successfully!');
    } catch (error: any) {
      console.error('Error sending email:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send email';
      
      if (errorMessage.includes('Email service not configured')) {
        toast.error('Email service not configured. Please set up Gmail SMTP credentials.', { duration: 6000 });
      } else {
        toast.error(`Failed to send email: ${errorMessage}`, { duration: 4000 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      console.log('Uploading file for processing:', file.name);
      setIsLoading(true);
      
      const loadingToast = toast.loading('Processing document... This may take a moment.');
      
      const response = await axios.post('http://localhost:3001/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      });
      
      console.log('File processed successfully:', response.data);
      toast.dismiss(loadingToast);
      
      const extractedLeads = response.data.leads || [];
      
      if (extractedLeads.length === 0) {
        toast('No leads found in the document. Please check the file content.', {
          icon: '⚠️',
          duration: 4000
        });
        return;
      }
      
      let addedCount = 0;
      let skippedCount = 0;
      
      for (const leadData of extractedLeads) {
        try {
          const leadToAdd = {
            name: leadData.name || 'Unknown',
            email: leadData.email || '',
            phone: leadData.phone || '',
            status: 'New' as const,
            source: 'Document' as const
          };
          
          await addLead(leadToAdd);
          addedCount++;
        } catch (error: any) {
          console.warn('Skipped duplicate or invalid lead:', leadData.email);
          skippedCount++;
        }
      }
      
      if (addedCount > 0) {
        toast.success(`Successfully extracted and added ${addedCount} leads from ${file.name}!`, { duration: 5000 });
      }
      
      if (skippedCount > 0) {
        toast('Some leads were skipped (duplicates or invalid data)', {
          icon: 'ℹ️',
          duration: 4000
        });
      }
      
    } catch (error: any) {
      console.error('Error processing file:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process file';
      
      if (error.code === 'ECONNABORTED') {
        toast.error('File processing timed out. Please try a smaller file or check your connection.', { duration: 6000 });
      } else if (errorMessage.includes('Unsupported file type')) {
        toast.error('Please upload PDF or image files only.', { duration: 4000 });
      } else if (errorMessage.includes('No text found')) {
        toast.error('Could not extract text from the file. Please ensure the document contains readable text.', { duration: 5000 });
      } else {
        toast.error(`Failed to process file: ${errorMessage}`, { duration: 4000 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const executeWorkflow = async (action: string, leadIds: string[], emailTemplate?: { subject: string; message: string }) => {
    try {
      console.log('Executing workflow:', { action, leadIds, emailTemplate });
      setIsLoading(true);
      
      const payload: any = {
        action,
        leadIds
      };
      
      if (emailTemplate) {
        payload.emailTemplate = emailTemplate;
      }
      
      if (action === 'update_status') {
        payload.status = 'Contacted';
      }
      
      const response = await axios.post('http://localhost:3001/api/workflow/execute', payload, {
        timeout: 120000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Workflow executed successfully:', response.data);
      await fetchLeads();
      
      const { results, processedLeads } = response.data;
      toast.success(`Workflow completed! Processed ${processedLeads} leads.`, { duration: 4000 });
      
    } catch (error: any) {
      console.error('Error executing workflow:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to execute workflow';
      toast.error(`Workflow failed: ${errorMessage}`, { duration: 4000 });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalLeads={leads.length}
        newLeads={leads.filter(l => l.status === 'New').length}
      />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm">⚠</span>
              </div>
              <div>
                <p className="text-red-800 font-medium">Connection Error</p>
                <p className="text-red-600 text-sm">{error}</p>
                <p className="text-red-500 text-xs mt-1">Make sure the backend server is running on port 3001</p>
              </div>
            </div>
            <button
              onClick={fetchLeads}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {activeTab === 'leads' && (
          <>
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <div className="flex gap-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Add Lead</span>
                </button>
                
                <button
                  onClick={fetchLeads}
                  disabled={isLoading}
                  className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <span>🔄</span>
                  <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
                </button>
              </div>

              <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border">
                {leads.length} total leads • {leads.filter(l => l.status === 'New').length} new • {leads.filter(l => l.status === 'Contacted').length} contacted
              </div>
            </div>

            {/* File Upload */}
            <LeadUpload onFileUpload={handleFileUpload} />

            {/* Leads Table */}
            <LeadTable 
              leads={leads} 
              onViewLead={setSelectedLead}
              onUpdateLead={updateLead}
              onDeleteLead={deleteLead}
              loading={isLoading}
            />
          </>
        )}

        {activeTab === 'workflow' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <ReactFlowCanvas 
              leads={leads} 
              onSendEmail={sendEmail}
              onExecuteWorkflow={executeWorkflow}
            />
          </div>
        )}

        {/* Lead Modal for viewing details */}
        {selectedLead && (
          <LeadModal
            lead={selectedLead}
            isOpen={!!selectedLead}
            onClose={() => setSelectedLead(null)}
            onSendEmail={sendEmail}
            onUpdateLead={updateLead}
          />
        )}

        {/* Lead Modal for adding/editing */}
        {(isModalOpen || editingLead) && (
          <LeadModal
            lead={editingLead || {
              id: '',
              name: '',
              email: '',
              phone: '',
              status: 'New',
              source: 'Manual',
              createdAt: new Date().toISOString()
            }}
            isOpen={isModalOpen || !!editingLead}
            onClose={() => {
              setIsModalOpen(false);
              setEditingLead(null);
            }}
            onSendEmail={sendEmail}
            onUpdateLead={editingLead ? (id, data) => updateLead(id, data) : (id, data) => addLead(data)}
          />
        )}
      </main>
    </div>
  );
};

export default App;
