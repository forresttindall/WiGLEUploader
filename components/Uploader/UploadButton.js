import React from 'react';

function UploadButton({ handleUpload, uploading, filesExist }) {
  return (
    <button 
      className="upload-btn" 
      onClick={handleUpload}
      disabled={uploading || !filesExist}
    >
      {uploading ? 'Uploading...' : 'Upload Files'}
    </button>
  );
}

export default UploadButton; 