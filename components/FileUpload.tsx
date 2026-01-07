
import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  onUpload: (file: File, base64: string) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit for Free Tier safety

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('File too large for Free Tier processing. Please upload a PDF under 5MB to avoid rate limits.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      onUpload(file, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [onUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative h-64 w-full max-w-2xl mx-auto rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group
        ${isDragging 
          ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
          : 'border-slate-700 hover:border-emerald-500/50 bg-slate-800/50'
        }
        ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
    >
      <input
        type="file"
        accept=".pdf"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className="text-center p-6">
        <div className={`mb-4 transition-transform duration-300 group-hover:scale-110 ${isDragging ? 'scale-110 text-emerald-500' : 'text-slate-400 group-hover:text-emerald-400'}`}>
          <i className="fa-solid fa-cloud-arrow-up text-5xl"></i>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-slate-100">
          {isDragging ? 'Drop your PDF here' : 'Drop your Brain Fuel'}
        </h3>
        <p className="text-sm text-slate-400 max-w-xs mx-auto">
          Upload any PDF up to 5MB to start a deep-dive conversation with AI.
        </p>
        <div className="mt-6 inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-emerald-900/20">
          Browse Files
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/60 rounded-3xl flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <span className="mt-4 text-emerald-400 font-medium animate-pulse">Initializing Neural Link...</span>
          </div>
        </div>
      )}
    </div>
  );
};
