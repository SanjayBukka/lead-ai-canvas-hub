import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import ImprovedHeader from './components/ImprovedHeader';
import LeadForm from './components/LeadForm';
import ImprovedLeadUpload from './components/ImprovedLeadUpload';
import LeadTable from './components/LeadTable';
import LeadModal from './components/LeadModal';
import ReactFlowCanvas from './components/ReactFlowCanvas';
import { Card, CardContent } from '@/components/ui/card';
import { TabsContent, Tabs } from '@/components/ui/tabs';
import { AlertCircle, RefreshCw } from 'lucide-react';

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
  const { toast } = useToast();

  const fetchLeads = async () => {
    try {
      console.log('Fetching leads from backend...');
      setIsLoading(true);
      const response = await axios.get('http://localhost:8000/api/leads', {
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
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch leads';
      setError(`Backend connection failed: ${errorMessage}`);
      toast({
        title: "Error",
        description: `Failed to fetch leads: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    try {
      console.log('Adding new lead:', leadData);
      setIsLoading(true);
      
      const response = await axios.post('http://localhost:8000/api/leads', leadData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Lead added successfully:', response.data);
      await fetchLeads();
      toast({
        title: "Success",
        description: "Lead added successfully!",
      });
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error adding lead:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to add lead';
      
      if (error.response?.status === 409) {
        toast({
          title: "Error",
          description: "A lead with this email already exists!",
          variant: "destructive",
        });
      } else if (error.response?.status === 400) {
        toast({
          title: "Validation Error",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to add lead: ${errorMessage}`,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateLead = async (id: string, leadData: Partial<Lead>) => {
    try {
      console.log('Updating lead:', id, leadData);
      setIsLoading(true);
      
      const response = await axios.put(`http://localhost:8000/api/leads/${id}`, leadData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Lead updated successfully:', response.data);
      await fetchLeads();
      toast({
        title: "Success",
        description: "Lead updated successfully!",
      });
    } catch (error: any) {
      console.error('Error updating lead:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update lead';
      toast({
        title: "Error",
        description: `Failed to update lead: ${errorMessage}`,
        variant: "destructive",
      });
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
      
      await axios.delete(`http://localhost:8000/api/leads/${id}`, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Lead deleted successfully');
      await fetchLeads();
      toast({
        title: "Success",
        description: "Lead deleted successfully!",
      });
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete lead';
      toast({
        title: "Error",
        description: `Failed to delete lead: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmail = async (leadId: string, subject: string, message: string) => {
    try {
      console.log('Sending email to lead:', leadId);
      setIsLoading(true);
      
      const response = await axios.post(`http://localhost:8000/api/leads/${leadId}/email`, {
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
      toast({
        title: "Success",
        description: "Email sent successfully!",
      });
    } catch (error: any) {
      console.error('Error sending email:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to send email';
      
      if (errorMessage.includes('Email service not configured')) {
        toast({
          title: "Configuration Error",
          description: "Email service not configured. Please set up Gmail SMTP credentials.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to send email: ${errorMessage}`,
          variant: "destructive",
        });
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
      
      toast({
        title: "Processing",
        description: "Processing document... This may take a moment.",
      });
      
      const response = await axios.post('http://localhost:8000/api/upload', formData, {
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
      
      const extractedLeads = response.data.leads || [];
      
      if (extractedLeads.length === 0) {
        toast({
          title: "No Leads Found",
          description: "No leads found in the document. Please check the file content.",
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
        toast({
          title: "Success",
          description: `Successfully extracted and added ${addedCount} leads from ${file.name}!`,
        });
      }
      
      if (skippedCount > 0) {
        toast({
          title: "Info",
          description: "Some leads were skipped (duplicates or invalid data)",
        });
      }
      
    } catch (error: any) {
      console.error('Error processing file:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to process file';
      
      if (error.code === 'ECONNABORTED') {
        toast({
          title: "Timeout Error",
          description: "File processing timed out. Please try a smaller file or check your connection.",
          variant: "destructive",
        });
      } else if (errorMessage.includes('Unsupported file type')) {
        toast({
          title: "File Type Error",
          description: "Please upload PDF or image files only.",
          variant: "destructive",
        });
      } else if (errorMessage.includes('No text found')) {
        toast({
          title: "Text Extraction Error",
          description: "Could not extract text from the file. Please ensure the document contains readable text.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Processing Error",
          description: `Failed to process file: ${errorMessage}`,
          variant: "destructive",
        });
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
      
      const response = await axios.post('http://localhost:8000/api/workflow/execute', payload, {
        timeout: 120000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Workflow executed successfully:', response.data);
      await fetchLeads();
      
      const { results, processedLeads } = response.data;
      toast({
        title: "Workflow Complete",
        description: `Workflow completed! Processed ${processedLeads} leads.`,
      });
      
    } catch (error: any) {
      console.error('Error executing workflow:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to execute workflow';
      toast({
        title: "Workflow Error",
        description: `Workflow failed: ${errorMessage}`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      <ImprovedHeader 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalLeads={leads.length}
        newLeads={leads.filter(l => l.status === 'New').length}
        onAddLead={() => setIsModalOpen(true)}
        onFileUpload={() => document.getElementById('fileUploadTrigger')?.click()}
      />
      
      <main className="container mx-auto px-6 py-8">
        {/* Error Display */}
        {error && (
          <Card className="mb-8 border-destructive/50 bg-destructive/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">Connection Error</p>
                    <p className="text-sm text-destructive/80">{error}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Make sure the backend server is running on port 8000
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchLeads}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm font-medium"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'leads' | 'workflow')}>
          <TabsContent value="leads" className="space-y-8">
            {/* File Upload */}
            <div id="fileUploadTrigger">
              <ImprovedLeadUpload 
                onFileUpload={handleFileUpload} 
                isUploading={isLoading}
              />
            </div>

            {/* Leads Table */}
            <Card>
              <CardContent className="p-0">
                <LeadTable 
                  leads={leads} 
                  onViewLead={setSelectedLead}
                  onUpdateLead={updateLead}
                  onDeleteLead={deleteLead}
                  loading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflow">
            <Card className="h-[calc(100vh-300px)]">
              <CardContent className="p-6 h-full">
                <ReactFlowCanvas 
                  leads={leads} 
                  onSendEmail={sendEmail}
                  onExecuteWorkflow={executeWorkflow}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
            onUpdateLead={editingLead 
              ? (id: string, data: Partial<Lead>) => updateLead(id, data)
              : (id: string, data: Partial<Lead>) => {
                  const fullLeadData: Omit<Lead, 'id' | 'createdAt'> = {
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    status: data.status || 'New',
                    source: data.source || 'Manual'
                  };
                  return addLead(fullLeadData);
                }
            }
          />
        )}
      </main>
    </div>
  );
};

export default App;
