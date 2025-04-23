import React from 'react';

function FileList({ files, removeFile, uploading }) {
  if (files.length === 0) return null;
  
  return (
    <div className="file-list">
      <h3>Selected Files ({files.length})</h3>
      <ul>
        {files.map((file, index) => (
          <li key={index}>
            <span className="file-name">{file.name}</span>
            <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
            <button 
              className="remove-btn" 
              onClick={() => removeFile(index)}
              disabled={uploading}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FileList; 