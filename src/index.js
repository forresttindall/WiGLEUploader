import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Add Geist Mono font
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Space+Mono&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

// Try to load Geist Mono if available (it's not on Google Fonts)
const geistFontStyle = document.createElement('style');
geistFontStyle.textContent = `
  @font-face {
    font-family: 'Geist Mono';
    src: url('https://cdn.jsdelivr.net/npm/geist-font@latest/fonts/geist-mono/GeistMono-Regular.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
  }
  
  body {
    font-family: 'Geist Mono', 'Space Mono', monospace;
  }
`;
document.head.appendChild(geistFontStyle);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
