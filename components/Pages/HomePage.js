import React from 'react';
import CredentialsForm from '../Uploader/CredentialsForm';
import UploaderSection from '../Uploader/UploaderSection';

function HomePage({ 
  credentials, 
  handleInputChange, 
  files, 
  setFiles, 
  uploading, 
  handleUpload, 
  uploadStatus, 
  setUploadStatus,
  removeFile 
}) {
  return (
    <>
      <CredentialsForm 
        credentials={credentials} 
        handleInputChange={handleInputChange} 
      />
      <UploaderSection 
        files={files}
        setFiles={setFiles}
        uploading={uploading}
        handleUpload={handleUpload}
        uploadStatus={uploadStatus}
        setUploadStatus={setUploadStatus}
        removeFile={removeFile}
      />
    </>
  );
}

export default HomePage; 