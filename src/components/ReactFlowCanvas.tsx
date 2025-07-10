
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
import { Play, Mail, CheckCircle, Plus } from 'lucide-react';
import { Lead } from '../App';

interface ReactFlowCanvasProps {
  leads: Lead[];
  onSendEmail: (leadId: string, subject: string, message: string) => void;
}

const ReactFlowCanvas: React.FC<ReactFlowCanvasProps> = ({ leads, onSendEmail }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: 'trigger',
      type: 'input',
      position: { x: 100, y: 100 },
      data: { 
        label: (
          <div className="flex items-center space-x-2 text-green-700">
            <Play className="w-4 h-4" />
            <span>Lead Created</span>
          </div>
        )
      },
      style: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        border: '2px solid #047857',
        borderRadius: '8px',
        padding: '10px',
        minWidth: '150px'
      }
    },
    {
      id: 'email',
      position: { x: 300, y: 50 },
      data: { 
        label: (
          <div className="flex items-center space-x-2 text-blue-700">
            <Mail className="w-4 h-4" />
            <span>Send Email</span>
          </div>
        )
      },
      style: {
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: 'white',
        border: '2px solid #1d4ed8',
        borderRadius: '8px',
        padding: '10px',
        minWidth: '150px'
      }
    },
    {
      id: 'update',
      position: { x: 300, y: 150 },
      data: { 
        label: (
          <div className="flex items-center space-x-2 text-purple-700">
            <CheckCircle className="w-4 h-4" />
            <span>Update Status</span>
          </div>
        )
      },
      style: {
        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        color: 'white',
        border: '2px solid #6d28d9',
        borderRadius: '8px',
        padding: '10px',
        minWidth: '150px'
      }
    }
  ]);

  const [edges, setEdges, onEdgesChange] = useEdgesState([
    {
      id: 'trigger-email',
      source: 'trigger',
      target: 'email',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 }
    },
    {
      id: 'trigger-update',
      source: 'trigger',
      target: 'update',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#8b5cf6', strokeWidth: 2 }
    }
  ]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.id === 'email') {
      // Simulate sending email to all new leads
      const newLeads = leads.filter(lead => lead.status === 'New');
      if (newLeads.length > 0) {
        const subject = 'Welcome! Let\'s discuss your needs';
        const message = 'Thank you for your interest. We\'d love to learn more about how we can help you achieve your goals.';
        
        newLeads.forEach(lead => {
          onSendEmail(lead.id, subject, message);
        });
        
        // Update node to show execution
        setNodes(nodes => nodes.map(n => 
          n.id === 'email' 
            ? {
                ...n,
                style: {
                  ...n.style,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: '2px solid #047857'
                }
              }
            : n
        ));
        
        // Reset after 2 seconds
        setTimeout(() => {
          setNodes(nodes => nodes.map(n => 
            n.id === 'email' 
              ? {
                  ...n,
                  style: {
                    ...n.style,
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    border: '2px solid #1d4ed8'
                  }
                }
              : n
          ));
        }, 2000);
      }
    }
  }, [leads, onSendEmail, setNodes]);

  return (
    <div className="h-96 bg-gray-50 rounded-lg border-2 border-gray-200">
      <div className="mb-4 p-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Lead Automation Workflow</h3>
            <p className="text-sm text-gray-600">
              Click on nodes to execute actions • {leads.filter(l => l.status === 'New').length} new leads ready for processing
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Trigger</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Action</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Update</span>
            </div>
          </div>
        </div>
      </div>
      
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
      >
        <MiniMap
          nodeColor={(node) => {
            if (node.id === 'trigger') return '#10b981';
            if (node.id === 'email') return '#3b82f6';
            return '#8b5cf6';
          }}
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
        <Controls />
        <Background color="#f3f4f6" gap={20} />
      </ReactFlow>
    </div>
  );
};

export default ReactFlowCanvas;
