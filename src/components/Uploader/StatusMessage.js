import React from 'react';

function StatusMessage({ uploadStatus }) {
  if (!uploadStatus) return null;
  
  return (
    <div className={`status-message ${uploadStatus.success ? 'success' : 'error'}`}>
      {uploadStatus.message}
    </div>
  );
}

export default StatusMessage; 