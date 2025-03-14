import React from 'react';

function CredentialsForm({ credentials, handleInputChange }) {
  return (
    <div className="credentials-section">
      <h2>WiGLE Authentication</h2>
      <p className="auth-info">
        Enter your WiGLE API credentials to upload files.
        Get your API at <a href="https://api.wigle.net/" target="_blank" rel="noopener noreferrer">api.wigle.net</a>
      </p>
      <br></br>
      <div className="input-group">
        <label htmlFor="username">API Name</label>
        <input
          type="text"
          id="username"
          name="username"
          value={credentials.username}
          onChange={handleInputChange}
          placeholder="Your WiGLE API Name"
        />
      </div>
      
      <div className="input-group">
        <label htmlFor="password">API Key</label>
        <input
          type="password"
          id="password"
          name="password"
          value={credentials.password}
          onChange={handleInputChange}
          placeholder="Your WiGLE API Key"
        />
      </div>
      
      <div className="remember-me">
        <input
          type="checkbox"
          id="rememberMe"
          name="rememberMe"
          checked={credentials.rememberMe}
          onChange={handleInputChange}
        />
        <label className="toggle-switch" htmlFor="rememberMe">
          <span className="toggle-track"></span>
        </label>
        <label htmlFor="rememberMe">Remember my credentials</label>
        <span className="info-tooltip">
          <span className="tooltip-text">
            Credentials are stored locally in your browser. Never shared with any server except WiGLE.
          </span>
          ℹ️
        </span>
      </div>
    </div>
  );
}

export default CredentialsForm; 