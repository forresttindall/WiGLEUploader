import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWifi } from '@fortawesome/free-solid-svg-icons';

function Navbar({ activePage, setActivePage }) {
  return (
    <nav className="nav-bar modern">
      <div className="nav-left">
        <div className="home-link" onClick={() => setActivePage('home')}>
          <div className="wifi-icon-fa">
            <FontAwesomeIcon 
              icon={faWifi} 
              className="wifi-icon-pulse" 
              style={{ color: '#0AC400' }} 
            />
          </div>
          <span className="site-title">WiGLE Uploader</span>
        </div>
      </div>
      <div className="nav-right">
        <button 
          className={`nav-button ${activePage === 'home' ? 'active' : ''}`} 
          onClick={() => setActivePage('home')}
        >
          Home
        </button>
        <button 
          className={`nav-button ${activePage === 'tools' ? 'active' : ''}`} 
          onClick={() => setActivePage('tools')}
        >
          Stats Generator
        </button>
        {/*<button 
          className={`nav-button ${activePage === 'route-planner' ? 'active' : ''}`} 
          onClick={() => setActivePage('route-planner')}
        >
          Route Planner
        </button>*/}
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