
import React from 'react';
import { Users, Workflow, BarChart3 } from 'lucide-react';

interface HeaderProps {
  activeTab: 'leads' | 'workflow';
  setActiveTab: (tab: 'leads' | 'workflow') => void;
  totalLeads: number;
  newLeads: number;
}

const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  setActiveTab, 
  totalLeads, 
  newLeads 
}) => {
  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                Lead Management AI
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Stats */}
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalLeads}</div>
                <div className="text-sm text-gray-500">Total Leads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{newLeads}</div>
                <div className="text-sm text-gray-500">New Leads</div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('leads')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'leads'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Leads</span>
              </button>
              <button
                onClick={() => setActiveTab('workflow')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'workflow'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Workflow className="w-4 h-4" />
                <span>Workflow</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
