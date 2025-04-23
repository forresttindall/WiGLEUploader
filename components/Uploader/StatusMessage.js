import React from 'react';

function StatusMessage({ uploadStatus }) {
  if (!uploadStatus) return null;
  
  const { success, message, progress, currentFile, totalFiles } = uploadStatus;
  const showProgress = uploading => uploading && progress !== undefined;
  const uploading = (message && message.includes('Uploading')) || (message && message.includes('Starting upload'));
  
  return (
    <div className={`status-message ${success ? 'success' : 'error'}`}>
      <p>{message}</p>
      
      {showProgress(uploading) && (
        <div className="upload-progress-info">
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="upload-progress-details">
            {currentFile && totalFiles && (
              <span>File {currentFile} of {totalFiles}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StatusMessage; 