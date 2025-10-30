import React, { useState } from 'react';

interface FileUploadProps {
  onFileUpload: (content: string) => void;
  isLoading: boolean;
}

export default function FileUpload({ onFileUpload, isLoading }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.txt')) {
      const text = await file.text();
      onFileUpload(text);
    } else {
      alert('Please upload a .txt file');
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.txt')) {
      const text = await file.text();
      onFileUpload(text);
    } else {
      alert('Please upload a .txt file');
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: isDragging ? '2px dashed #4CAF50' : '2px dashed #ccc',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: isDragging ? '#f0f8ff' : '#fafafa',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
    >
      <input
        type="file"
        accept=".txt"
        onChange={handleFileInput}
        style={{ display: 'none' }}
        id="file-input"
        disabled={isLoading}
      />
      <label htmlFor="file-input" style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
        <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
          {isLoading ? 'Processing...' : 'Drag & Drop Transcript File'}
        </p>
        <p style={{ fontSize: '14px', color: '#666' }}>
          or click to browse (.txt files only)
        </p>
      </label>
    </div>
  );
}
