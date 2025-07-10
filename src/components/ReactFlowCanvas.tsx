
import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, Mail, CheckCircle, Users, Send, Settings } from 'lucide-react';
import { Lead } from '../App';
import toast from 'react-hot-toast';

interface ReactFlowCanvasProps {
  leads: Lead[];
  onSendEmail: (leadId: string, subject: string, message: string) => void;
  onExecuteWorkflow?: (action: string, leadIds: string[], emailTemplate?: { subject: string; message: string }) => void;
}

const ReactFlowCanvas: React.FC<ReactFlowCanvasProps> = ({ 
  leads, 
  onSendEmail, 
  onExecuteWorkflow 
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<{[key: string]: boolean}>({});

  const initialNodes: Node[] = [
    {
      id: 'trigger',
      type: 'input',
      position: { x: 100, y: 100 },
      data: { 
        label: (
          <div className="flex items-center space-x-2 text-white font-medium">
            <Play className="w-4 h-4" />
            <div className="text-center">
              <div>New Lead Created</div>
              <div className="text-xs opacity-75">
                {leads.filter(l => l.status === 'New').length} new leads
              </div>
            </div>
          </div>
        )
      },
      style: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        border: '2px solid #047857',
        borderRadius: '12px',
        padding: '12px',
        minWidth: '160px',
        minHeight: '80px',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
      }
    },
    {
      id: 'email',
      position: { x: 350, y: 50 },
      data: { 
        label: (
          <div className="flex items-center space-x-2 text-white font-medium">
            <Mail className="w-4 h-4" />
            <div className="text-center">
              <div>Send Welcome Email</div>
              <div className="text-xs opacity-75">
                Auto-send to new leads
              </div>
            </div>
          </div>
        )
      },
      style: {
        background: executionResults.email ? 
          'linear-gradient(135deg, #10b981, #059669)' : 
          'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: 'white',
        border: executionResults.email ? '2px solid #047857' : '2px solid #1d4ed8',
        borderRadius: '12px',
        padding: '12px',
        minWidth: '160px',
        minHeight: '80px',
        cursor: 'pointer',
        boxShadow: executionResults.email ? 
          '0 4px 12px rgba(16, 185, 129, 0.3)' : 
          '0 4px 12px rgba(59, 130, 246, 0.3)',
        transition: 'all 0.3s ease'
      }
    },
    {
      id: 'update',
      position: { x: 350, y: 180 },
      data: { 
        label: (
          <div className="flex items-center space-x-2 text-white font-medium">
            <CheckCircle className="w-4 h-4" />
            <div className="text-center">
              <div>Update Status</div>
              <div className="text-xs opacity-75">
                Mark as contacted
              </div>
            </div>
          </div>
        )
      },
      style: {
        background: executionResults.update ? 
          'linear-gradient(135deg, #10b981, #059669)' : 
          'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        color: 'white',
        border: executionResults.update ? '2px solid #047857' : '2px solid #6d28d9',
        borderRadius: '12px',
        padding: '12px',
        minWidth: '160px',
        minHeight: '80px',
        cursor: 'pointer',
        boxShadow: executionResults.update ? 
          '0 4px 12px rgba(16, 185, 129, 0.3)' : 
          '0 4px 12px rgba(139, 92, 246, 0.3)',
        transition: 'all 0.3s ease'
      }
    },
    {
      id: 'batch',
      position: { x: 580, y: 115 },
      data: { 
        label: (
          <div className="flex items-center space-x-2 text-white font-medium">
            <Users className="w-4 h-4" />
            <div className="text-center">
              <div>Batch Process</div>
              <div className="text-xs opacity-75">
                Process all new leads
              </div>
            </div>
          </div>
        )
      },
      style: {
        background: executionResults.batch ? 
          'linear-gradient(135deg, #10b981, #059669)' : 
          'linear-gradient(135deg, #f59e0b, #d97706)',
        color: 'white',
        border: executionResults.batch ? '2px solid #047857' : '2px solid #b45309',
        borderRadius: '12px',
        padding: '12px',
        minWidth: '160px',
        minHeight: '80px',
        cursor: 'pointer',
        boxShadow: executionResults.batch ? 
          '0 4px 12px rgba(16, 185, 129, 0.3)' : 
          '0 4px 12px rgba(245, 158, 11, 0.3)',
        transition: 'all 0.3s ease'
      }
    }
  ];

  const initialEdges: Edge[] = [
    {
      id: 'trigger-email',
      source: 'trigger',
      target: 'email',
      type: 'smoothstep',
      animated: true,
      style: { 
        stroke: '#3b82f6', 
        strokeWidth: 3,
        filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))'
      },
      markerEnd: {
        type: 'arrowclosed' as any,
        color: '#3b82f6'
      }
    },
    {
      id: 'trigger-update',
      source: 'trigger',
      target: 'update',
      type: 'smoothstep',
      animated: true,
      style: { 
        stroke: '#8b5cf6', 
        strokeWidth: 3,
        filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3))'
      },
      markerEnd: {
        type: 'arrowclosed' as any,
        color: '#8b5cf6'
      }
    },
    {
      id: 'email-batch',
      source: 'email',
      target: 'batch',
      type: 'smoothstep',
      animated: true,
      style: { 
        stroke: '#f59e0b', 
        strokeWidth: 3,
        filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3))'
      },
      markerEnd: {
        type: 'arrowclosed' as any,
        color: '#f59e0b'
      }
    },
    {
      id: 'update-batch',
      source: 'update',
      target: 'batch',
      type: 'smoothstep',
      animated: true,
      style: { 
        stroke: '#f59e0b', 
        strokeWidth: 3,
        filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3))'
      },
      markerEnd: {
        type: 'arrowclosed' as any,
        color: '#f59e0b'
      }
    }
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Execute workflow actions
  const executeAction = async (nodeId: string) => {
    if (isExecuting) {
      toast.error('Another workflow is currently running. Please wait...');
      return;
    }

    const newLeads = leads.filter(lead => lead.status === 'New');
    
    if (newLeads.length === 0) {
      toast.warning('No new leads to process');
      return;
    }

    setIsExecuting(true);
    const loadingToast = toast.loading(`Executing ${nodeId} workflow...`);

    try {
      switch (nodeId) {
        case 'email':
          console.log('Executing email workflow for', newLeads.length, 'leads');
          
          // Default email template
          const emailTemplate = {
            subject: 'Welcome! Let\'s discuss your needs',
            message: `Hello {{name}},

Thank you for your interest in our services! We're excited to learn more about how we can help you achieve your goals.

Our team will review your information and get back to you within 24 hours. In the meantime, feel free to reply to this email with any questions you might have.

Looking forward to connecting with you soon!

Best regards,
The Lead Management Team`
          };

          if (onExecuteWorkflow) {
            await onExecuteWorkflow('send_email', newLeads.map(l => l.id), emailTemplate);
          } else {
            // Fallback to individual email sending
            for (const lead of newLeads.slice(0, 3)) { // Limit to first 3 for demo
              await onSendEmail(
                lead.id, 
                emailTemplate.subject, 
                emailTemplate.message.replace('{{name}}', lead.name)
              );
            }
          }
          
          setExecutionResults(prev => ({ ...prev, email: true }));
          toast.dismiss(loadingToast);
          toast.success(`Welcome emails sent to ${newLeads.length} new leads!`);
          break;

        case 'update':
          console.log('Executing status update workflow for', newLeads.length, 'leads');
          
          if (onExecuteWorkflow) {
            await onExecuteWorkflow('update_status', newLeads.map(l => l.id));
          } else {
            // Fallback - this won't work without the backend integration
            toast.dismiss(loadingToast);
            toast.error('Status update requires backend integration');
            return;
          }
          
          setExecutionResults(prev => ({ ...prev, update: true }));
          toast.dismiss(loadingToast);
          toast.success(`Status updated for ${newLeads.length} leads!`);
          break;

        case 'batch':
          console.log('Executing batch workflow for', newLeads.length, 'leads');
          
          // Execute both email and status update
          const batchEmailTemplate = {
            subject: 'Welcome to our community!',
            message: `Dear {{name}},

Welcome aboard! We're thrilled to have you join our community.

We've received your information and our team is already working to provide you with the best possible experience. Here's what you can expect:

• A personalized consultation within 24 hours
• Access to our exclusive resources and guides
• Regular updates on solutions tailored to your needs

Thank you for choosing us. We're excited to help you succeed!

Best regards,
Your Success Team`
          };

          if (onExecuteWorkflow) {
            // Send emails first
            await onExecuteWorkflow('send_email', newLeads.map(l => l.id), batchEmailTemplate);
            // Then update status
            await onExecuteWorkflow('update_status', newLeads.map(l => l.id));
          }
          
          setExecutionResults(prev => ({ ...prev, batch: true, email: true, update: true }));
          toast.dismiss(loadingToast);
          toast.success(`Batch processing completed for ${newLeads.length} leads!`);
          break;

        default:
          toast.dismiss(loadingToast);
          toast.error('Unknown workflow action');
          return;
      }

      // Visual feedback - update node appearance
      setNodes(nodes => nodes.map(node => 
        node.id === nodeId 
          ? {
              ...node,
              style: {
                ...node.style,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: '2px solid #047857',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
              }
            }
          : node
      ));

      // Reset visual feedback after 3 seconds
      setTimeout(() => {
        setExecutionResults(prev => ({ ...prev, [nodeId]: false }));
        setNodes(initialNodes);
      }, 3000);

    } catch (error: any) {
      console.error('Workflow execution error:', error);
      toast.dismiss(loadingToast);
      toast.error(`Workflow failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.id === 'trigger') {
      toast.info('This is the trigger node - it activates when new leads are created');
      return;
    }
    
    executeAction(node.id);
  }, [leads, onSendEmail, onExecuteWorkflow, isExecuting]);

  const resetWorkflow = () => {
    setExecutionResults({});
    setNodes(initialNodes);
    toast.success('Workflow reset successfully');
  };

  return (
    <div className="h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Lead Automation Workflow</h3>
            <p className="text-sm text-gray-600">
              Click on action nodes to execute workflows • {leads.filter(l => l.status === 'New').length} new leads ready
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={resetWorkflow}
              disabled={isExecuting}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <Settings className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Trigger</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Email</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Update</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Batch</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* React Flow Canvas */}
      <div className="h-full pt-20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          minZoom={0.5}
          maxZoom={1.5}
        >
          <MiniMap
            nodeColor={(node) => {
              if (node.id === 'trigger') return '#10b981';
              if (node.id === 'email') return executionResults.email ? '#10b981' : '#3b82f6';
              if (node.id === 'update') return executionResults.update ? '#10b981' : '#8b5cf6';
              if (node.id === 'batch') return executionResults.batch ? '#10b981' : '#f59e0b';
              return '#6b7280';
            }}
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="bg-white rounded border shadow-sm"
          />
          <Controls 
            className="bg-white rounded border shadow-sm"
            showZoom={true}
            showFitView={true}
            showInteractive={true}
          />
          <Background 
            color="#e5e7eb" 
            gap={20} 
            size={1}
            variant={'dots' as any}
          />
        </ReactFlow>
      </div>

      {/* Loading Overlay */}
      {isExecuting && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg z-20">
          <div className="bg-white rounded-lg p-6 shadow-xl flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 font-medium">Executing workflow...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReactFlowCanvas;
