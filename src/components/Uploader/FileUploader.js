import React, { useState } from 'react';

const FileUploader = ({ credentials, onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // File selection handler
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setMessage('');
    setUploadSuccess(false);
  };

  // Simple upload function - main upload logic is in App.js
  const handleUpload = async () => {
    if (!selectedFile || !credentials.username || !credentials.password) {
      setMessage('Please select a file and enter your API credentials.');
      return;
    }

    setIsUploading(true);
    setMessage('Preparing to upload...');
    
    try {
      // This is just a placeholder - actual upload happens in App.js
      setMessage('Upload functionality is handled by the main application.');
      
      // Notify parent component if needed
      if (onUploadComplete) {
        onUploadComplete(true, 'Upload initiated');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
      
      if (onUploadComplete) {
        onUploadComplete(false, error.message);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="file-uploader">
      <form>
        <div className="form-group">
          <label htmlFor="file">Select a file to upload:</label>
          <input 
            type="file" 
            id="file" 
            onChange={handleFileChange} 
            disabled={isUploading}
            accept=".txt,.csv,.kml,.kmz,.xml,.log,.db,.sqlite,.wigle,.kismet,.netxml,.netcsv,.pcap,.cap,.json,.gpx"
          />
        </div>
        
        <div className="form-group">
          <button 
            type="button" 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading || !credentials.username || !credentials.password}
            className={`upload-button ${isUploading ? 'uploading' : ''}`}
          >
            {isUploading ? 'Uploading...' : 'Upload to WiGLE'}
          </button>
        </div>
        
        {message && (
          <div className={`message ${uploadSuccess ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default FileUploader; 