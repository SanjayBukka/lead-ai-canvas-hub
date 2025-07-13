
import React from 'react';
import FeatureTest from '../components/FeatureTest';
import { Button } from '@/components/ui/button';
import { ArrowRight, Settings, Play } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-6 mb-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Lead Management System
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive system for managing leads with document processing, email automation, and workflow visualization.
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button 
              onClick={() => window.location.href = '/app'} 
              className="flex items-center gap-2"
              size="lg"
            >
              <Play className="h-4 w-4" />
              Launch Application
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </Button>
          </div>
        </div>
        
        <FeatureTest />
        
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 bg-card border rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">📊 Lead Management</h3>
            <p className="text-sm text-muted-foreground">
              Add, edit, and track leads with comprehensive status management and contact information.
            </p>
          </div>
          
          <div className="p-6 bg-card border rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">📄 Document Processing</h3>
            <p className="text-sm text-muted-foreground">
              Upload PDF and image files to automatically extract lead information using OCR technology.
            </p>
          </div>
          
          <div className="p-6 bg-card border rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">📧 Email Automation</h3>
            <p className="text-sm text-muted-foreground">
              Send personalized emails to leads with customizable templates and tracking.
            </p>
          </div>
          
          <div className="p-6 bg-card border rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">🔄 Workflow Visualization</h3>
            <p className="text-sm text-muted-foreground">
              Design and execute automated workflows with a visual flow editor.
            </p>
          </div>
          
          <div className="p-6 bg-card border rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">💾 Data Storage</h3>
            <p className="text-sm text-muted-foreground">
              Secure CSV-based storage with backup and export capabilities.
            </p>
          </div>
          
          <div className="p-6 bg-card border rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">🔍 Advanced Search</h3>
            <p className="text-sm text-muted-foreground">
              Filter and search through leads with advanced filtering options.
            </p>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-muted/50 rounded-lg border-l-4 border-primary">
          <h3 className="font-semibold mb-2">🚀 Getting Started</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Frontend:</strong> Already running on port 5173 (this interface)</p>
            <p><strong>Backend:</strong> Start with <code className="bg-muted px-2 py-1 rounded">cd backend && python app.py</code></p>
            <p><strong>Health Check:</strong> <a href="http://localhost:3001/api/health" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">http://localhost:3001/api/health</a></p>
            <p><strong>API Documentation:</strong> <a href="http://localhost:3001/docs" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">http://localhost:3001/docs</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
