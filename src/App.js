import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Navbar from './components/Navigation/Navbar';
import CredentialsForm from './components/Uploader/CredentialsForm';
import UploaderSection from './components/Uploader/UploaderSection';
import AboutPage from './components/Pages/AboutPage';
import ToolsPage from './components/Pages/ToolsPage';
import ContactPage from './components/Pages/ContactPage';
import RoutePlanner from './RoutePlanner';

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

  // Load saved credentials from localStorage
  useEffect(() => {
    const savedCredentials = localStorage.getItem('credentials');
    if (savedCredentials) {
      setCredentials(JSON.parse(savedCredentials));
    }
  }, []);

  // Add this useEffect to load Google Maps API properly
  useEffect(() => {
    // Load Google Maps API with your key
    const loadGoogleMapsAPI = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyC39qFGmCOo3FSV2AAYJMoR-OtspiPjkuU&libraries=visualization&callback=initMap&loading=async`;
      script.async = true;
      script.defer = true;
      
      // Define the callback function
      window.initMap = function() {
        // Maps API loaded
        console.log("Google Maps API loaded successfully");
      };
      
      document.head.appendChild(script);
    };
    
    // Check if API is already loaded
    if (!window.google || !window.google.maps) {
      loadGoogleMapsAPI();
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;
    
    setCredentials(prev => ({
      ...prev,
      [name]: inputValue
    }));
  };

  const handleUpload = async () => {
    console.clear();
    console.log('%c WiGLE Uploader - Debug Information ', 'background: #00ff9d; color: #000; font-weight: bold; padding: 4px;');
    console.log('Upload process started at:', new Date().toISOString());
    
    if (files.length === 0) {
      console.log('Error: No files selected');
      setUploadStatus({ success: false, message: 'No files selected' });
      return;
    }

    if (!credentials.username || !credentials.password) {
      console.log('Error: API Name and API Key are required');
      setUploadStatus({ success: false, message: 'API Name and API Key are required' });
      return;
    }

    console.log(`Credentials provided - API Name: ${credentials.username.substring(0, 3)}***, API Key: ${credentials.password ? '******' : 'empty'}`);
    console.log(`Files to upload (${files.length}):`, files.map(f => `${f.name} (${f.size} bytes)`));

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
      console.log(`Basic Authentication token created (first few chars: ${authToken.substring(0, 5)}...)`);
      
      // For each file, upload directly
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`\n--- Processing file ${i+1}/${files.length}: ${file.name} ---`);
        
        const formData = new FormData();
        formData.append('file', file);
        console.log(`FormData created with file: ${file.name}`);
        
        // Update status to show which file is being uploaded
        setUploadStatus({ 
          success: true, 
          message: `Uploading: ${file.name}`, 
          progress: Math.round((i / files.length) * 100),
          currentFile: i + 1,
          totalFiles: files.length
        });
        
        console.log(`Sending API request to WiGLE for file: ${file.name}`);
        console.log(`URL: https://api.wigle.net/api/v2/file/upload`);
        console.log(`Method: POST`);
        console.log(`Headers: Authorization: Basic ${authToken.substring(0, 5)}...`);
        
        try {
          console.time('API Request Duration');
          const response = await fetch('https://api.wigle.net/api/v2/file/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${authToken}`
            },
            body: formData
          });
          console.timeEnd('API Request Duration');
          
          console.log(`Response received - Status: ${response.status} ${response.statusText}`);
          console.log(`Response headers:`, Object.fromEntries([...response.headers.entries()]));
          
          // Get response text first for debugging
          const responseText = await response.text();
          console.log(`Response body (raw):`, responseText);
          
          // Try to parse as JSON
          let responseData;
          try {
            responseData = JSON.parse(responseText);
            console.log(`Response parsed as JSON:`, responseData);
          } catch (parseError) {
            console.error(`Error parsing response as JSON:`, parseError);
            console.error(`Raw response was:`, responseText);
            throw new Error(`Invalid response format: ${responseText.substring(0, 100)}`);
          }
          
          // Check for API errors
          if (!response.ok) {
            console.error(`HTTP error ${response.status}:`, responseData);
            const errorMessage = responseData.message || `HTTP error ${response.status}`;
            throw new Error(errorMessage);
          }
          
          if (responseData.success === false) {
            console.error(`API reported failure:`, responseData);
            const errorMessage = responseData.message || 'Unknown API error';
            throw new Error(errorMessage);
          }
          
          console.log(`File upload successful:`, responseData);
          
          // Update progress after successful upload
          setUploadStatus({
            success: true,
            message: `Successfully uploaded: ${file.name}`,
            progress: Math.round(((i + 1) / files.length) * 100),
            currentFile: i + 1,
            totalFiles: files.length
          });
        } catch (fetchError) {
          console.error(`Error during fetch operation:`, fetchError);
          throw fetchError;
        }
      }
      
      console.log(`\n%c ALL FILES UPLOADED SUCCESSFULLY `, 'background: green; color: white; font-weight: bold; padding: 4px;');
      
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
      console.error(`\n%c UPLOAD PROCESS FAILED `, 'background: red; color: white; font-weight: bold; padding: 4px;');
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack:`, error.stack);
      
      setUploadStatus({ 
        success: false, 
        message: `Error uploading files: ${error.message}`
      });
    } finally {
      console.log(`Upload process completed at: ${new Date().toISOString()}`);
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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
        {activePage === 'route-planner' && <RoutePlanner />}
        
        <Footer />
      </div>
    </div>
  );
}

export default App;