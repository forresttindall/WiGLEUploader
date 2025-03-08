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
    const savedCredentials = localStorage.getItem('wigleCredentials');
    if (savedCredentials) {
      try {
        const parsedCredentials = JSON.parse(savedCredentials);
        setCredentials({
          username: parsedCredentials.username || '',
          password: parsedCredentials.password || '',
          rememberMe: true
        });
      } catch (error) {
        console.error('Error parsing saved credentials:', error);
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
        localStorage.setItem('wigleCredentials', JSON.stringify({
          username: credentials.username,
          password: credentials.password
        }));
      } else {
        localStorage.removeItem('wigleCredentials');
      }
    } else if (credentials.rememberMe) {
      // Update saved credentials when they change and remember me is checked
      localStorage.setItem('wigleCredentials', JSON.stringify({
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
      setUploadStatus({ success: false, message: 'Username and password are required' });
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
      // For each file, create a FormData and upload
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        
        // Update status to show which file is being uploaded
        setUploadStatus({ 
          success: true, 
          message: `Uploading: ${file.name}`, 
          progress: Math.round((i / files.length) * 100),
          currentFile: i + 1,
          totalFiles: files.length
        });
        
        // Simulate API call with progress updates
        const totalSteps = 10;
        for (let step = 0; step <= totalSteps; step++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          const fileProgress = (step / totalSteps) * 100;
          const overallProgress = Math.round(((i + (fileProgress / 100)) / files.length) * 100);
          setUploadStatus({
            success: true,
            message: `Uploading: ${file.name}`,
            progress: overallProgress,
            currentFile: i + 1,
            totalFiles: files.length
          });
        }
      }
      
      // Final success message
      setUploadStatus({ 
        success: true, 
        message: `Successfully uploaded ${files.length} files. Please allow up to 1 hour for the WiGLE servers to process. Check https://wigle.net/stats#processing to see progress.`, 
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

  // Render the active page
  const renderActivePage = () => {
    switch (activePage) {
      case 'home':
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
      case 'tools':
        return <ToolsPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      default:
        return null;
    }
  };

  return (
    <div className="App">
      <div className="container">
        <Navbar activePage={activePage} setActivePage={setActivePage} />
        <Header />
        <div className="content-wrapper">
          {renderActivePage()}
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default App;
