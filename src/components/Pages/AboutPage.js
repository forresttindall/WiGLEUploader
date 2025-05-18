import React from 'react';
import './AboutPage.css'

function AboutPage() {
  return (
    <div className="page-content">
      <h2>About WiGLE Uploader</h2>
      <br></br>
      
      <h2>Created and maintained by <a href="https://forresttindall.dev/links" target="_blank" rel="noopener noreferrer">Forrest Tindall</a> Of <a href="https://creationbase.io" target="_blank" className="cb-text"><img src="./dot-triangle.png" className="cb-logo" /><span className="cb-text">Creationbase</span></a></h2> 

      <p>WiGLE Uploader is an open source tool designed to help you upload your wardriving files faster to the WiGLE database.</p>
      <br></br>
      <p>WiGLE Uploader features true privacy and stores no data.</p>
      <br></br>
      <ul>
        <li>Drag and drop file uploads</li>
        <li>Batch uploading of multiple files</li>
        <li>Support for all major wardriving file formats</li>
        <li>Simple and secure authentication</li>
        <li>Badge Generator for sharing your WiGLE stats</li>
      </ul>
      <br></br>
      
      <br></br>
      <br></br>
      <h2>Please support the project by <a href="https://account.venmo.com/u/ForrestTindall" target="_blank" rel="noopener noreferrer">donating here.</a></h2>
      <br></br>
      <h2>Please Star the GitHub Repo. <a href="https://github.com/forresttindall/WiGLEUploader" target='_blank'>Here</a></h2>
    </div>
  );
}

export default AboutPage; 