import React from 'react';

function AboutPage() {
  return (
    <div className="page-content">
      <h2>About WiGLE Uploader</h2>
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
      <h2>Created and maintained by <a href="https://forresttindall.dev" target="_blank" rel="noopener noreferrer">Forrest Tindall</a> 
      <br></br>
      <br></br>
      Please support the project by <a href="https://account.venmo.com/u/ForrestTindall" target="_blank" rel="noopener noreferrer">donating here.</a></h2>
    </div>
  );
}

export default AboutPage; 