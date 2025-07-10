
import React, { useState } from 'react';
import { X, Mail, Phone, Calendar, MessageCircle, Send, Sparkles } from 'lucide-react';
import { Lead } from '../App';

interface LeadModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSendEmail: (leadId: string, subject: string, message: string) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
}

const LeadModal: React.FC<LeadModalProps> = ({
  lead,
  isOpen,
  onClose,
  onSendEmail,
  onUpdateLead
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'chat' | 'email'>('details');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    type: 'user' | 'ai';
    message: string;
    timestamp: Date;
  }>>([]);
  const [chatInput, setChatInput] = useState('');

  if (!isOpen) return null;

  const handleSendEmail = () => {
    if (emailSubject && emailMessage) {
      onSendEmail(lead.id, emailSubject, emailMessage);
      setEmailSubject('');
      setEmailMessage('');
      setActiveTab('details');
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      message: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      let aiResponse = '';
      
      if (chatInput.toLowerCase().includes('follow-up') || chatInput.toLowerCase().includes('suggest')) {
        aiResponse = `Based on ${lead.name}'s profile, I suggest sending a personalized email about our latest product features. Their ${lead.source.toLowerCase()} source indicates they're actively researching solutions. Consider mentioning specific benefits that align with their business needs.`;
      } else if (chatInput.toLowerCase().includes('details') || chatInput.toLowerCase().includes('information')) {
        aiResponse = `Here are the key details about ${lead.name}:
        
• Contact: ${lead.email}${lead.phone ? ` | ${lead.phone}` : ''}
• Status: ${lead.status}
• Source: ${lead.source}
• Created: ${new Date(lead.createdAt).toLocaleDateString()}
• Engagement Level: ${lead.status === 'New' ? 'High potential - recently added' : 'Previously contacted - follow up needed'}

**Recommendation:** ${lead.status === 'New' ? 'Prioritize immediate outreach' : 'Schedule follow-up within 3-5 days'}`;
      } else {
        aiResponse = `I can help you with lead management for ${lead.name}. Try asking me to "suggest follow-up" strategies or request "lead details" for comprehensive information.`;
      }

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        message: aiResponse,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    }, 1000);

    setChatInput('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{lead.name}</h2>
              <p className="text-blue-100 mt-1">{lead.email}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'details', label: 'Details', icon: Calendar },
              { id: 'chat', label: 'AI Assistant', icon: MessageCircle },
              { id: 'email', label: 'Send Email', icon: Mail }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="flex items-center space-x-2 text-gray-900">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{lead.email}</span>
                    </div>
                  </div>
                  
                  {lead.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <div className="flex items-center space-x-2 text-gray-900">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{lead.phone}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={lead.status}
                      onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as 'New' | 'Contacted' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source
                    </label>
                    <div className="text-gray-900">{lead.source}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Created Date
                    </label>
                    <div className="flex items-center space-x-2 text-gray-900">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium text-gray-800">AI Lead Assistant</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Ask me about follow-up strategies, lead details, or any questions about {lead.name}.
                </p>
              </div>

              <div className="h-64 overflow-y-auto border rounded-lg p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>Start a conversation with the AI assistant</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.type === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleChatSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about this lead..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Hi ${lead.name},\n\nI hope this email finds you well...\n\nBest regards,\nYour Team`}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setActiveTab('details')}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={!emailSubject || !emailMessage}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Email</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadModal;
