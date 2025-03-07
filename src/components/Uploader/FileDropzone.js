import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

// Define accepted file extensions and types
const ACCEPTED_EXTENSIONS = [
  '.txt', '.csv', '.kml', '.kmz', '.xml', '.log', '.db', '.sqlite', '.wigle', 
  '.kismet', '.netxml', '.netcsv', '.pcap', '.cap', '.json', '.gpx'
];

// Define accepted wardriving formats with their common extensions
const WARDRIVING_FORMATS = {
  'DStumbler': ['.txt', '.log'],
  'G-Mon': ['.txt', '.csv'],
  'inSSIDer': ['.csv', '.xml'],
  'Kismac': ['.txt', '.csv', '.xml'],
  'Kismet': ['.netxml', '.csv', '.netcsv', '.pcap', '.cap', '.kismet'],
  'MacStumbler': ['.txt', '.log'],
  'NetStumbler': ['.txt', '.ns1', '.ns0', '.nst'],
  'Pocket Warrior': ['.txt', '.log'],
  'Wardrive-Android': ['.csv', '.db', '.sqlite'],
  'WiFiFoFum': ['.csv', '.txt'],
  'WiFi-Where': ['.csv', '.txt'],
  'WiGLE WiFi Wardriving': ['.csv', '.db', '.sqlite', '.wigle'],
  'Apple consolidated DB': ['.db', '.sqlite']
};

function FileDropzone({ onDrop, setUploadStatus }) {
  const onDropAccepted = useCallback(acceptedFiles => {
    onDrop(acceptedFiles);
  }, [onDrop]);

  const onDropRejected = useCallback(rejectedFiles => {
    const fileNames = rejectedFiles.map(file => file.file.name).join(', ');
    setUploadStatus({ 
      success: false, 
      message: `Invalid file format(s): ${fileNames}. Please upload only supported wardriving formats.` 
    });
  }, [setUploadStatus]);

  const validateFile = useCallback((file) => {
    // Get file extension
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    
    // Check if extension is in accepted list
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      return {
        code: 'file-invalid-type',
        message: `File type ${extension} is not supported`
      };
    }
    
    // Additional validation could be done here
    // For example, checking file headers for specific formats
    
    return null;
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDropAccepted,
    onDropRejected,
    validator: validateFile
  });

  return (
    <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
      <input {...getInputProps()} />
      {
        isDragActive ?
          <p>Drop the files here...</p> :
          <p>Drag & drop wardriving files here, or click to select files</p>
      }
      <div className="accepted-extensions">
        <p>Accepted file extensions: {ACCEPTED_EXTENSIONS.join(', ')}</p>
      </div>
    </div>
  );
}

export default FileDropzone; 