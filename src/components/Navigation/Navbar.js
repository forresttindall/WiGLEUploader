import React from 'react';

function Navbar({ activePage, setActivePage }) {
  return (
    <nav className="nav-bar">
      <div className="nav-left">
        <button 
          className={`nav-button ${activePage === 'home' ? 'active' : ''}`} 
          onClick={() => setActivePage('home')}
        >
          Home
        </button>
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