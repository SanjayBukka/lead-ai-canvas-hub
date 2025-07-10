
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, Loader } from 'lucide-react';

interface LeadUploadProps {
  onFileUpload: (file: File) => Promise<void>;
}

const LeadUpload: React.FC<LeadUploadProps> = ({ onFileUpload }) => {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploading(true);
      try {
        await onFileUpload(acceptedFiles[0]);
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setUploading(false);
      }
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Upload className="w-5 h-5 text-green-600" />
        <h2 className="text-xl font-semibold text-gray-800">Upload Documents</h2>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-green-500 bg-green-50'
            : uploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          {uploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader className="w-8 h-8 text-green-600 animate-spin" />
              <p className="text-sm text-gray-600">Processing document...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center space-x-4">
                <FileText className="w-8 h-8 text-red-500" />
                <Image className="w-8 h-8 text-blue-500" />
              </div>
              
              {isDragActive ? (
                <p className="text-green-600 font-medium">Drop the file here...</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-700 font-medium">
                    Drop your PDF or image file here
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse files
                  </p>
                </div>
              )}
              
              <div className="text-xs text-gray-400">
                Supports: PDF, PNG, JPG, JPEG, GIF, BMP, TIFF
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p className="flex items-center space-x-1">
          <span>🤖</span>
          <span>AI will extract lead information from your documents</span>
        </p>
      </div>
    </div>
  );
};

export default LeadUpload;
