
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
  const [error, setError] = useState<string | null>(null);

  // API Base URL - Update this to your backend URL
  const API_BASE = 'http://localhost:3001/api';

  // Configure axios defaults
  axios.defaults.timeout = 30000; // 30 seconds timeout
  axios.defaults.headers.common['Content-Type'] = 'application/json';

  // Add axios interceptor for error handling
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        console.log(`Response received from ${response.config.url}:`, response.status);
        return response;
      },
      (error) => {
        console.error('Response error:', error);
        
        if (error.code === 'ERR_NETWORK') {
          toast.error('Network error: Please check if the backend server is running on port 3001');
        } else if (error.response?.status >= 500) {
          toast.error('Server error: ' + (error.response?.data?.message || 'Internal server error'));
        } else if (error.response?.status >= 400) {
          toast.error('Request error: ' + (error.response?.data?.message || 'Bad request'));
        } else {
          toast.error('An unexpected error occurred');
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Fetch leads from backend with comprehensive error handling
  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching leads from backend...');
      const response = await axios.get(`${API_BASE}/leads`);
      
      if (response.data && Array.isArray(response.data)) {
        setLeads(response.data);
        console.log(`Successfully loaded ${response.data.length} leads`);
      } else {
        console.warn('Invalid response format:', response.data);
        setLeads([]);
      }
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      setError('Failed to fetch leads from server');
      
      if (error.code === 'ERR_NETWORK') {
        toast.error('Cannot connect to server. Please ensure the backend is running on port 3001.');
      } else {
        toast.error('Failed to fetch leads: ' + (error.response?.data?.message || error.message));
      }
      
      setLeads([]); // Set empty array as fallback
    } finally {
      setLoading(false);
    }
  };

  // Add new lead with validation and error handling
  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    try {
      console.log('Adding new lead:', leadData);
      
      // Client-side validation
      if (!leadData.name?.trim()) {
        toast.error('Name is required');
        return;
      }
      
      if (!leadData.email?.trim()) {
        toast.error('Email is required');
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(leadData.email)) {
        toast.error('Please enter a valid email address');
        return;
      }
      
      // Check for duplicate email on client side
      const existingLead = leads.find(lead => 
        lead.email.toLowerCase() === leadData.email.toLowerCase()
      );
      if (existingLead) {
        toast.error('A lead with this email already exists');
        return;
      }
      
      const response = await axios.post(`${API_BASE}/leads`, leadData);
      
      if (response.data) {
        setLeads(prev => [...prev, response.data]);
        toast.success(`Lead "${response.data.name}" added successfully!`);
        console.log('Lead added:', response.data.id);
      }
    } catch (error: any) {
      console.error('Error adding lead:', error);
      
      if (error.response?.status === 409) {
        toast.error('A lead with this email already exists');
      } else if (error.response?.status === 400) {
        toast.error('Invalid lead data: ' + (error.response?.data?.message || 'Please check your input'));
      } else {
        toast.error('Failed to add lead: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // Update lead with error handling
  const updateLead = async (id: string, updates: Partial<Lead>) => {
    if (!id) {
      toast.error('Invalid lead ID');
      return;
    }
    
    try {
      console.log('Updating lead:', id, updates);
      
      // Validate email if being updated
      if (updates.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updates.email)) {
          toast.error('Please enter a valid email address');
          return;
        }
      }
      
      const response = await axios.put(`${API_BASE}/leads/${id}`, updates);
      
      if (response.data) {
        setLeads(prev => prev.map(lead => 
          lead.id === id ? response.data : lead
        ));
        toast.success('Lead updated successfully!');
        console.log('Lead updated:', id);
      }
    } catch (error: any) {
      console.error('Error updating lead:', error);
      
      if (error.response?.status === 404) {
        toast.error('Lead not found');
        // Refresh leads to sync with server
        fetchLeads();
      } else {
        toast.error('Failed to update lead: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // Delete lead with confirmation and error handling
  const deleteLead = async (id: string) => {
    if (!id) {
      toast.error('Invalid lead ID');
      return;
    }
    
    const leadToDelete = leads.find(lead => lead.id === id);
    if (!leadToDelete) {
      toast.error('Lead not found');
      return;
    }
    
    // Show confirmation toast
    const confirmDelete = window.confirm(`Are you sure you want to delete "${leadToDelete.name}"? This action cannot be undone.`);
    if (!confirmDelete) {
      return;
    }
    
    try {
      console.log('Deleting lead:', id);
      
      await axios.delete(`${API_BASE}/leads/${id}`);
      
      setLeads(prev => prev.filter(lead => lead.id !== id));
      toast.success(`Lead "${leadToDelete.name}" deleted successfully!`);
      console.log('Lead deleted:', id);
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      
      if (error.response?.status === 404) {
        toast.error('Lead not found - it may have already been deleted');
        // Refresh leads to sync with server
        fetchLeads();
      } else {
        toast.error('Failed to delete lead: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // Send email to lead with validation
  const sendEmail = async (leadId: string, subject: string, message: string) => {
    if (!leadId || !subject?.trim() || !message?.trim()) {
      toast.error('Lead ID, subject, and message are required');
      return;
    }
    
    const lead = leads.find(l => l.id === leadId);
    if (!lead) {
      toast.error('Lead not found');
      return;
    }
    
    try {
      console.log('Sending email to lead:', leadId);
      
      await axios.post(`${API_BASE}/leads/${leadId}/email`, {
        subject: subject.trim(),
        message: message.trim()
      });
      
      // Update lead status to Contacted
      await updateLead(leadId, { status: 'Contacted' });
      
      toast.success(`Email sent successfully to ${lead.name}!`);
      console.log('Email sent to:', lead.email);
    } catch (error: any) {
      console.error('Error sending email:', error);
      
      if (error.response?.status === 404) {
        toast.error('Lead not found');
      } else if (error.response?.data?.message?.includes('Email service')) {
        toast.error('Email service is not configured. Please configure Gmail SMTP in the backend.');
      } else {
        toast.error('Failed to send email: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // Handle file upload and OCR processing with comprehensive error handling
  const handleFileUpload = async (file: File) => {
    if (!file) {
      toast.error('No file selected');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/tiff'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Unsupported file type: ${file.type}. Please upload PDF or image files.`);
      return;
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File too large. Please upload files smaller than 10MB.');
      return;
    }
    
    const loadingToast = toast.loading(`Processing ${file.name}...`);
    
    try {
      console.log('Uploading file:', file.name, file.type, file.size);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_BASE}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file processing
      });
      
      const extractedData = response.data;
      
      if (!extractedData?.leads || !Array.isArray(extractedData.leads)) {
        toast.dismiss(loadingToast);
        toast.error('Invalid response from server');
        return;
      }
      
      if (extractedData.leads.length === 0) {
        toast.dismiss(loadingToast);
        toast.warning('No lead information found in the document. Please check if the document contains names and email addresses.');
        return;
      }
      
      // Add extracted leads with duplicate checking
      let addedCount = 0;
      let duplicateCount = 0;
      
      for (const leadData of extractedData.leads) {
        try {
          // Check for duplicates before adding
          const existingLead = leads.find(lead => 
            lead.email.toLowerCase() === leadData.email.toLowerCase()
          );
          
          if (existingLead) {
            duplicateCount++;
            console.log('Skipping duplicate lead:', leadData.email);
            continue;
          }
          
          await addLead({
            ...leadData,
            source: 'Document',
            status: 'New'
          });
          addedCount++;
        } catch (error) {
          console.error('Error adding extracted lead:', error);
        }
      }
      
      toast.dismiss(loadingToast);
      
      if (addedCount > 0) {
        toast.success(`Successfully extracted and added ${addedCount} leads from ${file.name}!`);
      }
      
      if (duplicateCount > 0) {
        toast.warning(`${duplicateCount} duplicate leads were skipped.`);
      }
      
      console.log(`File processing complete: ${addedCount} added, ${duplicateCount} duplicates`);
      
    } catch (error: any) {
      console.error('Error processing file:', error);
      toast.dismiss(loadingToast);
      
      if (error.code === 'ECONNABORTED') {
        toast.error('File processing timeout. Please try with a smaller file.');
      } else if (error.response?.status === 422) {
        toast.error(error.response.data.message || 'Could not extract lead information from the document');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid file format');
      } else {
        toast.error('Failed to process file: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // Execute workflow automation
  const executeWorkflow = async (action: string, leadIds: string[], emailTemplate?: { subject: string; message: string }) => {
    if (!action || !leadIds || leadIds.length === 0) {
      toast.error('Invalid workflow parameters');
      return;
    }
    
    try {
      console.log('Executing workflow:', action, leadIds);
      
      const response = await axios.post(`${API_BASE}/workflow/execute`, {
        action,
        leadIds,
        emailTemplate,
        status: action === 'update_status' ? 'Contacted' : undefined
      });
      
      if (response.data) {
        toast.success(`Workflow executed successfully! Processed ${response.data.processedLeads} leads.`);
        
        // Refresh leads to get updated data
        await fetchLeads();
        
        console.log('Workflow execution results:', response.data.results);
      }
    } catch (error: any) {
      console.error('Error executing workflow:', error);
      toast.error('Failed to execute workflow: ' + (error.response?.data?.message || error.message));
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

  // Load leads on component mount
  useEffect(() => {
    fetchLeads();
  }, []);

  // Auto-refresh leads every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchLeads();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading]);

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
              primary: '#10b981',
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
        newLeads={leads.filter(lead => lead.status === 'New').length}
      />
      
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => {
                  setError(null);
                  fetchLeads();
                }}
                className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
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
              <ReactFlowCanvas 
                leads={leads} 
                onSendEmail={sendEmail}
                onExecuteWorkflow={executeWorkflow}
              />
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
