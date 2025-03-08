import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWifi } from '@fortawesome/free-solid-svg-icons';

function Navbar({ activePage, setActivePage }) {
  return (
    <nav className="nav-bar">
      <div className="nav-left">
        <div className="home-link" onClick={() => setActivePage('home')}>
          <div className="wifi-icon-container">
            <FontAwesomeIcon icon={faWifi} className="wifi-icon-fa" />
          </div>
        </div>
      </div>
      <div className="nav-right">
        <button 
          className={`nav-button ${activePage === 'tools' ? 'active' : ''}`} 
          onClick={() => setActivePage('tools')}
        >
          Other Tools
        </button>
        <button 
          className={`nav-button ${activePage === 'about' ? 'active' : ''}`} 
          onClick={() => setActivePage('about')}
        >
          About
        </button>
        <button 
          className={`nav-button ${activePage === 'contact' ? 'active' : ''}`} 
          onClick={() => setActivePage('contact')}
        >
          Contact
        </button>
      </div>
    </nav>
  );
}

export default Navbar; 