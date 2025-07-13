
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

const FeatureTest: React.FC = () => {
  const [testResults, setTestResults] = useState<{ [key: string]: boolean | null }>({});
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const runTest = async (testName: string, testFunction: () => Promise<boolean> | boolean) => {
    try {
      setTestResults(prev => ({ ...prev, [testName]: null }));
      const result = await Promise.resolve(testFunction());
      setTestResults(prev => ({ ...prev, [testName]: result }));
      
      toast({
        title: `Test: ${testName}`,
        description: result ? "✅ Passed" : "❌ Failed",
        variant: result ? "default" : "destructive",
      });
      return result;
    } catch (error) {
      setTestResults(prev => ({ ...prev, [testName]: false }));
      toast({
        title: `Test: ${testName}`,
        description: `❌ Error: ${error}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const testUIComponents = async () => {
    return await runTest("UI Components", () => {
      const button = document.querySelector('button');
      const input = document.querySelector('input');
      const cards = document.querySelectorAll('[data-testid="card"], .card, [class*="card"]');
      return !!(button && input && cards.length > 0);
    });
  };

  const testToastSystem = async () => {
    return await runTest("Toast System", () => {
      toast({
        title: "Test Toast",
        description: "This is a test notification",
      });
      return true;
    });
  };

  const testTabs = async () => {
    return await runTest("Tabs Navigation", () => {
      const tabsList = document.querySelector('[role="tablist"]');
      const tabTriggers = document.querySelectorAll('[role="tab"]');
      return !!(tabsList && tabTriggers.length > 0);
    });
  };

  const testFormInputs = async () => {
    return await runTest("Form Inputs", () => {
      const inputs = document.querySelectorAll('input');
      const textareas = document.querySelectorAll('textarea');
      return inputs.length > 0 || textareas.length > 0;
    });
  };

  const testBackendConnection = async () => {
    return await runTest("Backend Connection", async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        return response.ok;
      } catch (error) {
        console.error('Backend connection test failed:', error);
        return false;
      }
    });
  };

  const testLocalStorage = async () => {
    return await runTest("Local Storage", () => {
      try {
        const testKey = 'test-key';
        const testValue = 'test-value';
        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        return retrieved === testValue;
      } catch (error) {
        return false;
      }
    });
  };

  const runAllTests = async () => {
    setIsRunning(true);
    try {
      await testUIComponents();
      await testToastSystem();
      await testTabs();
      await testFormInputs();
      await testBackendConnection();
      await testLocalStorage();
      
      toast({
        title: "All Tests Complete",
        description: "Check the results below",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getTestIcon = (result: boolean | null) => {
    if (result === null) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    return result ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getTestStatus = (result: boolean | null) => {
    if (result === null) return "RUNNING...";
    return result ? "PASSED" : "FAILED";
  };

  const getTestColor = (result: boolean | null) => {
    if (result === null) return "text-muted-foreground";
    return result ? "text-green-700" : "text-red-700";
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Feature Testing Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={runAllTests} 
            variant="default" 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning && <Loader2 className="h-4 w-4 animate-spin" />}
            Run All Tests
          </Button>
          <Button onClick={testUIComponents} variant="outline" disabled={isRunning}>
            Test UI Components
          </Button>
          <Button onClick={testToastSystem} variant="outline" disabled={isRunning}>
            Test Toast System
          </Button>
          <Button onClick={testTabs} variant="outline" disabled={isRunning}>
            Test Tabs
          </Button>
          <Button onClick={testFormInputs} variant="outline" disabled={isRunning}>
            Test Form Inputs
          </Button>
          <Button onClick={testBackendConnection} variant="outline" disabled={isRunning}>
            Test Backend
          </Button>
          <Button onClick={testLocalStorage} variant="outline" disabled={isRunning}>
            Test Storage
          </Button>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Test Results:</h3>
          {Object.keys(testResults).length === 0 ? (
            <p className="text-muted-foreground">No tests run yet. Click a test button above to start.</p>
          ) : (
            <div className="grid gap-2">
              {Object.entries(testResults).map(([testName, result]) => (
                <div key={testName} className="flex items-center gap-3 p-3 border rounded-lg">
                  {getTestIcon(result)}
                  <span className={`font-medium ${getTestColor(result)}`}>
                    {testName}: {getTestStatus(result)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Tabs defaultValue="sample" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sample">Sample Tab 1</TabsTrigger>
            <TabsTrigger value="test">Sample Tab 2</TabsTrigger>
            <TabsTrigger value="demo">Demo Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="sample">
            <div className="p-4 border rounded-lg space-y-4">
              <h4 className="font-medium mb-2">Sample Form Components</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="Test input field" />
                <Input placeholder="Another input field" />
                <Button variant="secondary">Test Button</Button>
                <Button variant="outline">Outline Button</Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="test">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Interactive Test Area</h4>
              <p className="text-muted-foreground mb-4">
                This tab tests the tab switching functionality and interactive elements.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => toast({ title: "Tab Test", description: "Tab interaction working!" })}
                  size="sm"
                >
                  Test Toast from Tab
                </Button>
                <Button variant="secondary" size="sm">
                  Secondary Action
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="demo">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Demo Components</h4>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Demo Input</label>
                  <Input placeholder="Enter some text..." />
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm">Small</Button>
                  <Button>Default</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">System Information</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Frontend: React + Vite + TypeScript</p>
            <p>UI Framework: Tailwind CSS + shadcn/ui</p>
            <p>Backend Expected: Python Flask/FastAPI on port 3001</p>
            <p>Current Time: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureTest;
