import React, { useState } from 'react';
import './App.css';

// Components
import Navbar from './components/Navigation/Navbar';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';

// Pages
import HomePage from './components/Pages/HomePage';
import ToolsPage from './components/Pages/ToolsPage';
import AboutPage from './components/Pages/AboutPage';
import ContactPage from './components/Pages/ContactPage';

function App() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [activePage, setActivePage] = useState('home');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
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
    setUploadStatus({ success: true, message: 'Starting upload...' });

    try {
      // For each file, create a FormData and upload
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        
        // In a real implementation, you would use the WiGLE API endpoint
        // const response = await fetch('https://api.wigle.net/api/v2/file/upload', {
        //   method: 'POST',
        //   headers: {
        //     'Authorization': 'Basic ' + btoa(`${credentials.username}:${credentials.password}`)
        //   },
        //   body: formData
        // });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setUploadStatus({ 
          success: true, 
          message: `Uploaded ${i + 1}/${files.length}: ${file.name}` 
        });
      }
      
      setUploadStatus({ 
        success: true, 
        message: `Successfully uploaded ${files.length} files` 
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
          <HomePage 
            credentials={credentials}
            handleInputChange={handleInputChange}
            files={files}
            setFiles={setFiles}
            uploading={uploading}
            handleUpload={handleUpload}
            uploadStatus={uploadStatus}
            setUploadStatus={setUploadStatus}
            removeFile={removeFile}
          />
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
