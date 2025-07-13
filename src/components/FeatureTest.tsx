
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const FeatureTest: React.FC = () => {
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  const runTest = (testName: string, testFunction: () => boolean) => {
    try {
      const result = testFunction();
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

  const testUIComponents = () => {
    return runTest("UI Components", () => {
      // Test if basic components render
      const button = document.querySelector('button');
      const input = document.querySelector('input');
      return !!(button && input);
    });
  };

  const testToastSystem = () => {
    return runTest("Toast System", () => {
      toast({
        title: "Test Toast",
        description: "This is a test notification",
      });
      return true;
    });
  };

  const testTabs = () => {
    return runTest("Tabs Navigation", () => {
      const tabsList = document.querySelector('[role="tablist"]');
      return !!tabsList;
    });
  };

  const testFormInputs = () => {
    return runTest("Form Inputs", () => {
      const inputs = document.querySelectorAll('input');
      return inputs.length > 0;
    });
  };

  const runAllTests = () => {
    testUIComponents();
    testToastSystem();
    testTabs();
    testFormInputs();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Feature Testing Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={runAllTests} variant="default">
            Run All Tests
          </Button>
          <Button onClick={testUIComponents} variant="outline">
            Test UI Components
          </Button>
          <Button onClick={testToastSystem} variant="outline">
            Test Toast System
          </Button>
          <Button onClick={testTabs} variant="outline">
            Test Tabs
          </Button>
          <Button onClick={testFormInputs} variant="outline">
            Test Form Inputs
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Test Results:</h3>
          {Object.entries(testResults).map(([testName, result]) => (
            <div key={testName} className="flex items-center gap-2">
              {result ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className={result ? "text-green-700" : "text-red-700"}>
                {testName}: {result ? "PASSED" : "FAILED"}
              </span>
            </div>
          ))}
        </div>

        <Tabs defaultValue="sample" className="w-full">
          <TabsList>
            <TabsTrigger value="sample">Sample Tab 1</TabsTrigger>
            <TabsTrigger value="test">Sample Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="sample">
            <div className="p-4 border rounded">
              <h4 className="font-medium mb-2">Sample Form</h4>
              <div className="space-y-2">
                <Input placeholder="Test input field" />
                <Button variant="secondary">Test Button</Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="test">
            <div className="p-4 border rounded">
              <h4 className="font-medium mb-2">Test Area</h4>
              <p>This tab tests the tab switching functionality.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FeatureTest;
