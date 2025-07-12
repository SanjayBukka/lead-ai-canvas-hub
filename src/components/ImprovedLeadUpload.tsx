
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Image, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ImprovedLeadUploadProps {
  onFileUpload: (file: File) => void;
  isUploading?: boolean;
}

const ImprovedLeadUpload: React.FC<ImprovedLeadUploadProps> = ({ 
  onFileUpload, 
  isUploading = false 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploadStatus('idle');
      await onFileUpload(file);
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error) {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  const getStatusIcon = () => {
    if (isUploading) return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    if (uploadStatus === 'success') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (uploadStatus === 'error') return <AlertCircle className="h-5 w-5 text-red-500" />;
    return <Upload className="h-8 w-8 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (isUploading) return 'Processing document...';
    if (uploadStatus === 'success') return 'Document processed successfully!';
    if (uploadStatus === 'error') return 'Error processing document';
    return 'Drop your document here or click to browse';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Upload & OCR Processing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            dragActive
              ? 'border-primary bg-primary/10'
              : uploadStatus === 'success'
              ? 'border-green-300 bg-green-50'
              : uploadStatus === 'error'
              ? 'border-red-300 bg-red-50'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          } ${isUploading ? 'pointer-events-none opacity-75' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isUploading && document.getElementById('fileInput')?.click()}
        >
          <input
            id="fileInput"
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
            onChange={handleChange}
            disabled={isUploading}
          />
          
          <div className="flex flex-col items-center gap-4">
            {getStatusIcon()}
            
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">
                {getStatusText()}
              </p>
              
              {!isUploading && uploadStatus === 'idle' && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Supports PDF documents and images (JPG, PNG, GIF, BMP, TIFF)
                  </p>
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      PDF
                    </div>
                    <div className="flex items-center gap-1">
                      <Image className="h-3 w-3" />
                      Images
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium text-sm mb-2">How it works:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Upload PDF documents or images containing lead information</li>
            <li>• AI extracts names, emails, and phone numbers automatically</li>
            <li>• New leads are added to your database with 'Document' source</li>
            <li>• Duplicate emails are automatically filtered out</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImprovedLeadUpload;
