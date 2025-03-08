import React, { useState, useEffect } from 'react';
import './App.css';

// Components
import Navbar from './components/Navigation/Navbar';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import CredentialsForm from './components/Uploader/CredentialsForm';
import UploaderSection from './components/Uploader/UploaderSection';

// Pages
import ToolsPage from './components/Pages/ToolsPage';
import AboutPage from './components/Pages/AboutPage';
import ContactPage from './components/Pages/ContactPage';

function App() {
  const [activePage, setActivePage] = useState('home');
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  // Load saved credentials on initial render
  useEffect(() => {
    const savedCredentials = localStorage.getItem('wigleApiCredentials');
    if (savedCredentials) {
      try {
        const parsedCredentials = JSON.parse(savedCredentials);
        setCredentials({
          username: parsedCredentials.username || '',
          password: parsedCredentials.password || '',
          rememberMe: true
        });
      } catch (error) {
        console.error('Error parsing saved API credentials:', error);
      }
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setCredentials(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // If remember me is checked, save credentials to localStorage
    // If unchecked, remove saved credentials
    if (name === 'rememberMe') {
      if (checked) {
        localStorage.setItem('wigleApiCredentials', JSON.stringify({
          username: credentials.username,
          password: credentials.password
        }));
      } else {
        localStorage.removeItem('wigleApiCredentials');
      }
    } else if (credentials.rememberMe) {
      // Update saved credentials when they change and remember me is checked
      localStorage.setItem('wigleApiCredentials', JSON.stringify({
        ...credentials,
        [name]: newValue
      }));
    }
  };

  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus({ success: false, message: 'No files selected' });
      return;
    }

    if (!credentials.username || !credentials.password) {
      setUploadStatus({ success: false, message: 'API Name and API Key are required' });
      return;
    }

    setUploading(true);
    setUploadStatus({ 
      success: true, 
      message: 'Starting upload...', 
      progress: 0,
      currentFile: 0,
      totalFiles: files.length
    });

    try {
      // Create the Basic Authentication token
      const authToken = btoa(`${credentials.username}:${credentials.password}`);
      
      // For each file, create a FormData and upload
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        
        // Add any additional required parameters for the WiGLE API
        // formData.append('donate', 'on');  // Example: if you want to donate the file
        
        // Update status to show which file is being uploaded
        setUploadStatus({ 
          success: true, 
          message: `Uploading: ${file.name}`, 
          progress: Math.round((i / files.length) * 100),
          currentFile: i + 1,
          totalFiles: files.length
        });
        
        // Make the actual API call to WiGLE
        const response = await fetch('https://api.wigle.net/api/v2/file/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authToken}`
          },
          body: formData
        });
        
        // Parse the response
        const responseData = await response.json();
        
        // Check for API errors
        if (!response.ok || responseData.success === false) {
          const errorMessage = responseData.message || `HTTP error ${response.status}`;
          throw new Error(errorMessage);
        }
        
        // Update progress after successful upload
        setUploadStatus({
          success: true,
          message: `Successfully uploaded: ${file.name}`,
          progress: Math.round(((i + 1) / files.length) * 100),
          currentFile: i + 1,
          totalFiles: files.length
        });
      }
      
      // Final success message
      setUploadStatus({ 
        success: true, 
        message: `Successfully uploaded ${files.length} files. Please allow up to 20 minutes for the WiGLE servers to process.`, 
        progress: 100,
        currentFile: files.length,
        totalFiles: files.length
      });
      setFiles([]);
    } catch (error) {
      setUploadStatus({ 
        success: false, 
        message: `Error uploading files: ${error.message}` 
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <Navbar activePage={activePage} setActivePage={setActivePage} />
        <Header />
        
        {activePage === 'home' && (
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
        )}
        
        {activePage === 'about' && <AboutPage />}
        {activePage === 'tools' && <ToolsPage />}
        {activePage === 'contact' && <ContactPage />}
        
        <Footer />
      </div>
    </div>
  );
}

export default App;