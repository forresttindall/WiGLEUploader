import React, { useCallback } from 'react';
import FileDropzone from './FileDropzone';
import FileList from './FileList';
import UploadButton from './UploadButton';
import StatusMessage from './StatusMessage';

function UploaderSection({ files, setFiles, uploading, handleUpload, uploadStatus, setUploadStatus, removeFile }) {
  const onDrop = useCallback(acceptedFiles => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    // Clear any previous error messages when new files are successfully added
    if (uploadStatus && !uploadStatus.success) {
      setUploadStatus(null);
    }
  }, [setFiles, uploadStatus, setUploadStatus]);

  return (
    <div className="upload-section">
      <h2>Upload Files</h2>
      <FileDropzone onDrop={onDrop} setUploadStatus={setUploadStatus} />
      <FileList files={files} removeFile={removeFile} uploading={uploading} />
      <UploadButton 
        handleUpload={handleUpload} 
        uploading={uploading} 
        filesExist={files.length > 0} 
      />
      <StatusMessage uploadStatus={uploadStatus} />
    </div>
  );
}

export default UploaderSection; 