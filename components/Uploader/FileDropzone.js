import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

// Define accepted file extensions and types
const ACCEPTED_EXTENSIONS = [
  '.txt', '.csv', '.kml', '.kmz', '.xml', '.log', '.db', '.sqlite', '.wigle', 
  '.kismet', '.netxml', '.netcsv', '.pcap', '.cap', '.json', '.gpx'
];

// Define accepted wardriving formats with their common extensions
// eslint-disable-next-line no-unused-vars
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
      <div className="dropzone-content">
        <div className="upload-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" style={{ overflow: 'visible' }}>
            <defs>
              <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feFlood floodColor="#e64c77" floodOpacity="0.5" result="glowColor"/>
                <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow"/>
                <feMerge>
                  <feMergeNode in="softGlow"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <linearGradient id="uploadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f09433" />
                <stop offset="20%" stopColor="#e6683c" />
                <stop offset="40%" stopColor="#dc2743" />
                <stop offset="60%" stopColor="#cc2366" />
                <stop offset="80%" stopColor="#bc1888" />
                <stop offset="100%" stopColor="#7b3fff" />
              </linearGradient>
            </defs>
            <path 
              d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"
              fill="url(#uploadGradient)"
              filter="url(#glow)"
              className="upload-path"
            />
          </svg>
        </div>
        {
          isDragActive ?
            <p>Drop the files here...</p> :
            <p>Drag & drop wardriving files here, or click to select files</p>
        }
        <div className="accepted-extensions">
          <p>Accepted file extensions: {ACCEPTED_EXTENSIONS.join(', ')}</p>
        </div>
      </div>
    </div>
  );
}

export default FileDropzone; 