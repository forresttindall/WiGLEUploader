import React from 'react';

function ToolsPage() {
  return (
    <div className="page-content">
      <h2>Other Tools</h2>
      <p>Here you can find additional tools for working with WiGLE data.</p>
      <ul className="tools-list">
        <li>
          <h3>WiGLE WiFi Wardriving App</h3>
          <p>The official mobile app for collecting wireless network data.</p>
          <button 
            className="tool-download"
            onClick={() => window.open('https://play.google.com/store/apps/details?id=net.wigle.wigleandroid&pli=1', '_blank')}
          >
            Download
          </button>
        </li>
        <li>
          <h3>User Data Badge</h3>
          <p>A stylish display badge for your WiGLE account.</p>
          <a href="#" className="coming-soon">Coming Soon</a>
        </li>
      </ul>
    </div>
  );
}

export default ToolsPage; 