import React from 'react';

function CredentialsForm({ credentials, handleInputChange }) {
  return (
    <div className="credentials-section">
      <h2>WiGLE Authentication</h2>
      <p className="auth-info">
        Enter your WiGLE account credentials to upload files.
        Don't have an account? <a href="https://wigle.net/register" target="_blank" rel="noopener noreferrer">Register at WiGLE.net</a>
      </p>
      <br></br>
      <div className="input-group">
        <label htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          name="username"
          value={credentials.username}
          onChange={handleInputChange}
          placeholder="Your WiGLE username"
        />
      </div>
      
      <div className="input-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          value={credentials.password}
          onChange={handleInputChange}
          placeholder="Your WiGLE password"
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