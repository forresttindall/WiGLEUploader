import React, { useState, useRef } from 'react';
import './ToolsPage.css';
import html2canvas from 'html2canvas';
import { Trophy, CalendarCheck, Info } from "phosphor-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWifi } from '@fortawesome/free-solid-svg-icons';
import '../../App.css';

function ToolsPage() {
  const [credentials, setCredentials] = useState(() => {
    const savedCredentials = localStorage.getItem('wigleCredentials');
    return savedCredentials ? JSON.parse(savedCredentials) : {
      username: '',
      apiToken: '',
      displayName: ''
    };
  });
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const badgeRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => {
      const newCredentials = {
        ...prev,
        [name]: value
      };
      
      localStorage.setItem('wigleCredentials', JSON.stringify(newCredentials));
      return newCredentials;
    });
  };

  const fetchUserStats = async () => {
    if (!credentials.username || !credentials.apiToken) {
      setError('Please enter both API Name and API Token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create the Basic Authentication token
      const authToken = btoa(`${credentials.username}:${credentials.apiToken}`);
      
      // Fetch user statistics from WiGLE API
      const response = await fetch('https://api.wigle.net/api/v2/stats/user', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authToken}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Failed to fetch user data');
      }
      
      console.log('WiGLE API response:', data);
      
      // Extract user data from the response
      const userName = credentials.displayName || 
                      (typeof data.user === 'string' ? data.user : credentials.username);
      
      // Extract rank and monthRank, with fallbacks
      let rank = '?';
      let monthRank = '?';
      
      // Check for rank in various locations
      if (typeof data.rank === 'number') {
        rank = data.rank;
      } else if (data.statistics && typeof data.statistics.rank === 'number') {
        rank = data.statistics.rank;
      } else if (data.user && typeof data.user.rank === 'number') {
        rank = data.user.rank;
      }
      
      // Check for monthRank in various locations
      if (typeof data.monthRank === 'number') {
        monthRank = data.monthRank;
      } else if (data.statistics && typeof data.statistics.monthRank === 'number') {
        monthRank = data.statistics.monthRank;
      } else if (data.user && typeof data.user.monthRank === 'number') {
        monthRank = data.user.monthRank;
      }
      
      console.log(`Extracted rank: ${rank}, monthRank: ${monthRank}`);
      
      // Extract the discoveredWiFiGPS value
      let discoveredWiFi = 0;
      
      // Check for discoveredWiFiGPS in various locations
      if (data.statistics && typeof data.statistics.discoveredWiFiGPS === 'number') {
        discoveredWiFi = data.statistics.discoveredWiFiGPS;
      } else if (typeof data.discoveredWiFiGPS === 'number') {
        discoveredWiFi = data.discoveredWiFiGPS;
      } else if (data.user && typeof data.user.discoveredWiFiGPS === 'number') {
        discoveredWiFi = data.user.discoveredWiFiGPS;
      }
      
      // If we still don't have a value, check for alternative field names
      if (discoveredWiFi === 0) {
        if (data.statistics) {
          if (typeof data.statistics.discoveredWifiGPS === 'number') {
            discoveredWiFi = data.statistics.discoveredWifiGPS;
          } else if (typeof data.statistics.discoveredWifiGps === 'number') {
            discoveredWiFi = data.statistics.discoveredWifiGps;
          }
        }
        
        if (discoveredWiFi === 0) {
          if (typeof data.discoveredWifiGPS === 'number') {
            discoveredWiFi = data.discoveredWifiGPS;
          } else if (typeof data.discoveredWifiGps === 'number') {
            discoveredWiFi = data.discoveredWifiGps;
          }
        }
      }
      
      const userStats = {
        userName,
        rank,
        monthRank,
        discoveredWiFi
      };
      
      setUserData(userStats);
      
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Update the downloadBadgeImage function
  const downloadBadgeImage = async () => {
    const badgeElement = badgeRef.current;
    if (!badgeElement) return;

    // Wait for web fonts to load
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Optionally, scroll into view
    badgeElement.scrollIntoView({ behavior: "auto", block: "center" });

    // Hide SVG icons, show emoji fallback (if you add them in your JSX)
    badgeElement.classList.add('screenshot-mode');

    try {
      const canvas = await html2canvas(badgeElement, {
        backgroundColor: null,
        useCORS: true,
        scale: 2,
        logging: false,
        removeContainer: true,
        windowWidth: badgeElement.scrollWidth,
        windowHeight: badgeElement.scrollHeight,
      });

      // Remove screenshot mode
      badgeElement.classList.remove('screenshot-mode');

      // Check if running on iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      
      try {
        // Temporarily remove gradient text for screenshot
        const userName = document.querySelector('.digital-badge-user h2');
        const originalStyle = userName ? userName.style.cssText : '';
        
        if (userName) {
          userName.style.background = 'none';
          userName.style.webkitBackgroundClip = 'initial';
          userName.style.webkitTextFillColor = '#0AC400';
        }

        // Restore original style
        if (userName) {
          userName.style.cssText = originalStyle;
        }

        if (isIOS) {
          // For iOS, use the native share functionality
          canvas.toBlob(async (blob) => {
            try {
              // Try native share first
              const file = new File([blob], `wigle-stats-${userData?.userName || 'user'}.png`, { 
                type: 'image/png',
                lastModified: new Date().getTime()
              });

              if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                  files: [file],
                  title: 'WiGLE Stats Badge',
                  text: 'Check out my WiGLE statistics!'
                });
              } else {
                // Fallback for older iOS versions
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `wigle-stats-${userData?.userName || 'user'}.png`;
                link.click();
                setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
              }
            } catch (error) {
              console.error('Error sharing:', error);
              // Final fallback - open in new window
              const blobUrl = URL.createObjectURL(blob);
              window.open(blobUrl);
              setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
            }
          }, 'image/png', 1.0);
        } else {
          // For Android and other devices
          canvas.toBlob(async (blob) => {
            try {
              // Try native share on Android
              const file = new File([blob], `wigle-stats-${userData?.userName || 'user'}.png`, { 
                type: 'image/png',
                lastModified: new Date().getTime()
              });

              if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                  files: [file],
                  title: 'WiGLE Stats Badge',
                  text: 'Check out my WiGLE statistics!'
                });
              } else {
                // Fallback to direct download
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `wigle-stats-${userData?.userName || 'user'}.png`;
                link.href = blobUrl;
                link.click();
                setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
              }
            } catch (error) {
              console.error('Error sharing:', error);
              // Fallback to direct download
              const link = document.createElement('a');
              link.download = `wigle-stats-${userData?.userName || 'user'}.png`;
              link.href = canvas.toDataURL('image/png');
              link.click();
            }
          }, 'image/png', 1.0);
        }
      } catch (error) {
        console.error('Error generating image:', error);
        alert('There was an error generating the image. Please try again.');
      }
    } catch (error) {
      badgeElement.classList.remove('screenshot-mode');
      alert('There was an error generating the image. Please try again.');
    }
  };

  return (
    <div className="tools-page">
      <h1>WiGLE Tools</h1>
      
      <div className="api-credentials">
        <h2>WiGLE API Credentials</h2>
        <p>Enter your WiGLE API credentials to access your statistics.</p>
        
        <div className="credentials-form">
          <div className="form-group">
            <label htmlFor="username">API Name</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              placeholder="Your WiGLE API name"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="apiToken">API Token</label>
            <input
              type="password"
              id="apiToken"
              name="apiToken"
              value={credentials.apiToken}
              onChange={handleInputChange}
              placeholder="Your WiGLE API token"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="displayName">Display Name (Optional)</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={credentials.displayName}
              onChange={handleInputChange}
              placeholder="Custom display name"
            />
          </div>
          
          <button 
            className="fetch-button"
            onClick={fetchUserStats}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Generate Badge'}
          </button>
          
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
      
      {userData && (
        <div className="tools-container">
          <div className="wigle-digital-badge" ref={badgeRef}>
            <div className="digital-badge-header">
              <div className="digital-badge-logo">
                <FontAwesomeIcon icon={faWifi} className="wifi-icon-large" />
                <span>WiGLE.net</span>
              </div>
              <div className="digital-badge-user">
                <h2>{userData?.userName || 'WiGLE User'}</h2>
              </div>
            </div>
            
            <div className="digital-badge-stats-container">
              <div className="digital-badge-stat">
                <div className="digital-badge-stat-icon">
                  <FontAwesomeIcon icon={faWifi} size="2x" />
                </div>
                <div className="digital-badge-stat-content">
                  <div className="digital-badge-stat-value">{formatNumber(userData?.discoveredWiFi || 0)}</div>
                  <div className="digital-badge-stat-label">WiFi Networks</div>
                </div>
              </div>
              
              <div className="digital-badge-stat">
                <div className="digital-badge-stat-icon">
                  <Trophy size={40} weight="duotone" />
                </div>
                <div className="digital-badge-stat-content">
                  <div className="digital-badge-stat-value">#{userData?.rank || '0'}</div>
                  <div className="digital-badge-stat-label">Global Rank</div>
                </div>
              </div>
              
              <div className="digital-badge-stat">
                <div className="digital-badge-stat-icon">
                  <CalendarCheck size={40} weight="duotone" />
                </div>
                <div className="digital-badge-stat-content">
                  <div className="digital-badge-stat-value">#{userData?.monthRank || '0'}</div>
                  <div className="digital-badge-stat-label">Monthly Rank</div>
                </div>
              </div>
            </div>
            
            <div className="digital-badge-footer">
              <div className="badge-date">Generated on {new Date().toLocaleDateString()}</div>
              <div className="badge-site">WiGLEUploader.net</div>
            </div>
          </div>
          
          
          <button 
            className="download-button" 
            onClick={downloadBadgeImage}
            disabled={!userData}
          >
            Download Badge Image
          </button>
        </div>
      )}
      
      <div className="instructions-section">
        <div className="instructions-header">
          <h2>How to Get Your WiGLE API Credentials</h2>
          <button 
            className="info-icon-button"
            onClick={() => setShowInstructions(!showInstructions)}
            aria-label={showInstructions ? "Hide instructions" : "Show instructions"}
          >
            <Info size={24} weight="bold" />
          </button>
        </div>
        
        {showInstructions && (
          <div className="instructions">
            <ol>
              <li>Log in to your WiGLE account at <a href="https://wigle.net" target="_blank" rel="noopener noreferrer">wigle.net</a></li>
              <li>Click on "Account" in the top navigation menu</li>
              <li>Scroll down to the "API" section</li>
              <li>Copy your API Name and API Token</li>
              <li>Paste them into the form above</li>
              <li>Optionally, enter a custom display name if you want something different than your WiGLE username</li>
            </ol>
            <p><strong>Note:</strong> Your API credentials are stored locally in your browser and are never sent to our servers.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ToolsPage; 