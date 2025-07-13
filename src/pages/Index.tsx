
import React from 'react';
import FeatureTest from '../components/FeatureTest';

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Welcome to Your Lead Management App</h1>
          <p className="text-xl text-muted-foreground">Testing all features and functionality!</p>
        </div>
        
        <FeatureTest />
        
        <div className="text-sm text-muted-foreground">
          <p>If you see this page, the frontend is working correctly.</p>
          <p>Check the backend connection by looking at the console logs.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
