import React, { useState, useEffect, useRef } from 'react';
import './ToolsPage.css';
import html2canvas from 'html2canvas';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWifi } from '@fortawesome/free-solid-svg-icons';

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
  const [activityData, setActivityData] = useState([]);
  const calendarRef = useRef(null);
  const [showInstructions, setShowInstructions] = useState(false);

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
      
      const rank = data.rank || '?';
      
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
        discoveredWiFi
      };
      
      setUserData(userStats);
      
      // Generate mock activity data (in a real app, you'd fetch this from WiGLE)
      generateMockActivityData();
      
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateMockActivityData = () => {
    // This would be replaced with actual API data in a production app
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    const days = [];
    let currentDate = new Date(oneYearAgo);
    
    while (currentDate <= today) {
      // Generate random upload data
      const hasUpload = Math.random() > 0.7;
      const uploadSize = hasUpload ? Math.floor(Math.random() * 1000) : 0;
      
      days.push({
        date: new Date(currentDate),
        count: uploadSize,
        intensity: uploadSize > 0 ? Math.min(Math.floor(uploadSize / 100) + 1, 4) : 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setActivityData(days);
  };

  const downloadImage = async () => {
    if (!calendarRef.current) return;
    
    try {
      // Create a clone of the element
      const clone = calendarRef.current.cloneNode(true);
      document.body.appendChild(clone);
      
      // Style the clone for optimal capture
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.width = '925px';
      clone.style.maxWidth = 'none';
      clone.style.padding = '40px';
      clone.style.paddingTop = '0px';
      clone.style.marginTop = '0px';
      clone.style.margin = '0';
      clone.style.boxSizing = 'border-box';
      
      // Reset any transformations
      clone.style.transform = 'none';
      clone.style.transition = 'none';
      
      // Center the header elements on a single line with appropriate padding
      const header = clone.querySelector('.stats-header');
      if (header) {
        header.style.display = 'flex';
        header.style.flexDirection = 'row';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'center';
        header.style.width = '100%';
        header.style.padding = '0.5rem 0';
        header.style.margin = '0';
        header.style.boxSizing = 'border-box';
      }
      
      // Adjust the home link (icon)
      const homeLink = clone.querySelector('.home-link');
      if (homeLink) {
        homeLink.style.marginRight = '20px'; // Add 20px padding to the right of the icon
      }
      
      // Adjust user info
      const userInfo = clone.querySelector('.user-info');
      if (userInfo) {
        userInfo.style.display = 'flex';
        userInfo.style.flexDirection = 'row';
        userInfo.style.alignItems = 'center';
        userInfo.style.width = 'auto';
        userInfo.style.flex = '0 0 auto';
        userInfo.style.padding = '0.5rem';
        userInfo.style.margin = '0';
      }
      
      // Adjust username
      const username = userInfo ? userInfo.querySelector('h3') : null;
      if (username) {
        username.style.margin = '0 2rem 0 0';
        username.style.whiteSpace = 'nowrap';
        username.style.padding = '0';
      }
      
      // Adjust stats highlights
      const statsHighlights = clone.querySelector('.stats-highlights');
      if (statsHighlights) {
        statsHighlights.style.display = 'flex';
        statsHighlights.style.flexDirection = 'row';
        statsHighlights.style.alignItems = 'center';
        statsHighlights.style.padding = '0';
        statsHighlights.style.margin = '0';
      }
      
      // Adjust stat boxes
      const statBoxes = clone.querySelectorAll('.stat-box');
      statBoxes.forEach(box => {
        box.style.margin = '0 0.75rem';
        box.style.padding = '0.4rem';
      });
      
      // Center the calendar and remove excess padding
      const calendar = clone.querySelector('.activity-calendar');
      if (calendar) {
        calendar.style.display = 'flex';
        calendar.style.flexDirection = 'column';
        calendar.style.alignItems = 'center';
        calendar.style.width = '100%';
        calendar.style.marginTop = '1rem';
        calendar.style.padding = '0';
      }
      
      // Adjust the calendar container
      const calendarContainer = clone.querySelector('.calendar-container');
      if (calendarContainer) {
        calendarContainer.style.padding = '0';
        calendarContainer.style.margin = '0';
      }
      
      // Adjust the footer
      const footer = clone.querySelector('.stats-footer');
      if (footer) {
        footer.style.marginTop = '1rem';
        footer.style.padding = '0';
      }
      
      // Force layout calculation
      void clone.offsetWidth;
      
      // Capture the image with exact dimensions and no extra space
      const canvas = await html2canvas(clone, {
        backgroundColor: '#121212',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: clone.offsetWidth,
        height: clone.offsetHeight
      });
      
      // Remove the clone
      document.body.removeChild(clone);
      
      // Get image data URL
      const image = canvas.toDataURL('image/png', 1.0);
      
      // Handle mobile vs desktop download
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isMobile) {
        setShowInstructions(true);
        const blob = dataURLtoBlob(image);
        const blobUrl = URL.createObjectURL(blob);
        
        // For iOS devices
        if (isIOS) {
          // Create a full-screen viewer with the same styling as desktop
          const viewer = document.createElement('div');
          viewer.style.position = 'fixed';
          viewer.style.top = '0';
          viewer.style.left = '0';
          viewer.style.width = '100vw';
          viewer.style.height = '100vh';
          viewer.style.backgroundColor = '#121212';
          viewer.style.zIndex = '9999';
          viewer.style.overflow = 'auto';
          viewer.style.display = 'flex';
          viewer.style.flexDirection = 'column';
          viewer.style.alignItems = 'center';
          viewer.style.padding = '0';
          
          // Add a close button
          const closeBtn = document.createElement('button');
          closeBtn.innerText = 'Close';
          closeBtn.style.position = 'fixed';
          closeBtn.style.top = '10px';
          closeBtn.style.right = '10px';
          closeBtn.style.padding = '8px 16px';
          closeBtn.style.backgroundColor = '#333';
          closeBtn.style.color = '#fff';
          closeBtn.style.border = 'none';
          closeBtn.style.borderRadius = '4px';
          closeBtn.style.cursor = 'pointer';
          closeBtn.style.zIndex = '10000';
          closeBtn.onclick = () => {
            document.body.removeChild(viewer);
          };
          
          // Create a container for the image that allows horizontal scrolling
          const imgContainer = document.createElement('div');
          imgContainer.style.width = '100%';
          imgContainer.style.overflowX = 'auto';
          imgContainer.style.overflowY = 'hidden';
          imgContainer.style.WebkitOverflowScrolling = 'touch';
          imgContainer.style.display = 'flex';
          imgContainer.style.justifyContent = 'center';
          imgContainer.style.alignItems = 'center';
          imgContainer.style.padding = '0';
          imgContainer.style.margin = '0';
          
          // Create the image
          const img = document.createElement('img');
          img.src = blobUrl;
          img.style.width = 'auto';
          img.style.height = 'auto';
          img.style.maxHeight = '90vh';
          img.style.display = 'block';
          img.style.margin = '0';
          img.style.padding = '0';
          
          // Add instructions
          const instructions = document.createElement('p');
          instructions.innerText = 'Press and hold on the image, then select "Save Image" to add it to your photos.';
          instructions.style.color = '#fff';
          instructions.style.textAlign = 'center';
          instructions.style.padding = '10px';
          instructions.style.margin = '10px 0';
          instructions.style.width = '100%';
          
          // Assemble the viewer
          imgContainer.appendChild(img);
          viewer.appendChild(closeBtn);
          viewer.appendChild(imgContainer);
          viewer.appendChild(instructions);
          document.body.appendChild(viewer);
        } else {
          // For Android - open in a new window with centered image
          const newWindow = window.open();
          newWindow.document.write(`
            <html>
              <head>
                <title>WiGLE Stats Badge</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body {
                    margin: 0;
                    padding: 0;
                    background-color: #121212;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-height: 100vh;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                  }
                  .img-container {
                    width: 100%;
                    overflow-x: auto;
                    overflow-y: hidden;
                    -webkit-overflow-scrolling: touch;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 0;
                    margin: 0;
                  }
                  img {
                    width: auto;
                    height: auto;
                    max-height: 90vh;
                    display: block;
                    margin: 0;
                    padding: 0;
                  }
                  p {
                    color: white;
                    text-align: center;
                    padding: 10px;
                    margin: 10px 0;
                    width: 100%;
                  }
                </style>
              </head>
              <body>
                <div class="img-container">
                  <img src="${blobUrl}" alt="WiGLE Stats Badge">
                </div>
                <p>Press and hold on the image, then select "Save Image" to add it to your photos.</p>
              </body>
            </html>
          `);
          newWindow.document.close();
        }
        
        // Clean up the blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      } else {
        // For desktop - use standard download
        const link = document.createElement('a');
        link.href = image;
        link.download = `wigle-stats-${credentials.displayName || 'user'}.png`;
        link.click();
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setError('Failed to generate image');
    }
  };
  
  // Helper function to convert data URL to Blob
  const dataURLtoBlob = (dataURL) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  };

  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Group activity data by month and week for the calendar
  const getCalendarData = () => {
    const months = [];
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Group by month
    let currentMonth = -1;
    let currentWeeks = [];
    let currentWeek = [];
    
    activityData.forEach((day, index) => {
      const month = day.date.getMonth();
      const dayOfWeek = day.date.getDay();
      
      // Start a new month
      if (month !== currentMonth) {
        if (currentMonth !== -1) {
          // Add any remaining days to the last week
          if (currentWeek.length > 0) {
            currentWeeks.push(currentWeek);
          }
          
          // Add the completed month
          months.push({
            name: monthLabels[currentMonth],
            weeks: currentWeeks
          });
        }
        
        currentMonth = month;
        currentWeeks = [];
        currentWeek = Array(dayOfWeek).fill(null); // Pad the beginning of the week
      }
      
      // Add the day to the current week
      currentWeek.push(day);
      
      // Start a new week on Sunday or at the end of the data
      if (dayOfWeek === 6 || index === activityData.length - 1) {
        // Pad the end of the week if needed
        if (dayOfWeek !== 6) {
          currentWeek = [...currentWeek, ...Array(6 - dayOfWeek).fill(null)];
        }
        
        currentWeeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    // Add the last month
    if (currentMonth !== -1) {
      months.push({
        name: monthLabels[currentMonth],
        weeks: currentWeeks
      });
    }
    
    return months;
  };

  return (
    <div className="page-content tools-page">
      <div className="padding">
      <h2>WiGLE Stats Badge Generator</h2>
      <p>Create a shareable image showing your WiGLE contribution activity.</p>
      </div>
      <div className="stats-generator">
        <div className="credentials-section">
          <h3>Enter your WiGLE API credentials</h3>
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
            <label htmlFor="apiToken">API Token</label>
            <input
              type="password"
              id="apiToken"
              name="apiToken"
              value={credentials.apiToken}
              onChange={handleInputChange}
              placeholder="Your WiGLE API Token"
            />
          </div>
          <div className="input-group">
            <label htmlFor="displayName">Username</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={credentials.displayName}
              onChange={handleInputChange}
              placeholder="Name to display on the badge"
            />
          </div>
          <button
            className="fetch-button"
            onClick={fetchUserStats}
            disabled={loading || (!credentials.username || !credentials.apiToken)}
          >
            {loading ? 'Loading...' : 'Generate Stats'}
          </button>
          {error && <div className="error-message">{error}</div>}
        </div>
        
        {userData && (
          <div className="stats-preview">
            <div className="stats-card" ref={calendarRef}>
              <div className="stats-header">
                <div className="home-link">
                  <div className="wifi-icon-container">
                    <FontAwesomeIcon icon={faWifi} className="wifi-icon-fa" />
                  </div>
                  <div className="wigle-text">WiGLE.net</div>
                </div>
                <div className="user-info">
                  <h3>{userData.userName}</h3>
                  <div className="stats-highlights">
                    <div className="stat-box">
                      <span className="stat-value">{formatNumber(userData.discoveredWiFi)}</span>
                      <span className="stat-label">New WiFi Discovered</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-value">#{userData.rank}</span>
                      <span className="stat-label">Global Rank</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="activity-calendar">
                <div className="calendar-container">
                  <div className="day-labels">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                  </div>
                  
                  <div className="months-grid">
                    {getCalendarData().map((month, monthIndex) => (
                      <div key={monthIndex} className="month-column">
                        <div className="month-label">{month.name}</div>
                        <div className="weeks-container">
                          {month.weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="week-row">
                              {week.map((day, dayIndex) => (
                                <div 
                                  key={dayIndex} 
                                  className={`day-cell ${day ? `intensity-${day.intensity}` : 'empty'}`}
                                  title={day ? `${day.date.toDateString()}: ${day.count} uploads` : ''}
                                >
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="intensity-legend">
                  <span>Less</span>
                  <div className="legend-cells">
                    <div className="day-cell intensity-0"></div>
                    <div className="day-cell intensity-1"></div>
                    <div className="day-cell intensity-2"></div>
                    <div className="day-cell intensity-3"></div>
                    <div className="day-cell intensity-4"></div>
                  </div>
                  <span>More</span>
                </div>
              </div>
              
              <div className="stats-footer">
                <p>WiGLEUploader.net • {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            <button 
              className="download-button"
              onClick={downloadImage}
            >
              Download Image
            </button>
            
            {/* Enhanced mobile instructions */}
            {showInstructions && (
              <div className="mobile-save-instructions">
                <h4>Save Your Badge</h4>
                {/iPad|iPhone|iPod/.test(navigator.userAgent) ? (
                  <p>
                    On iOS: Tap and hold on the image that appears, then select "Save to Photos"
                  </p>
                ) : (
                  <p>
                    On Android: The download should start automatically. Check your notification bar or Downloads folder.
                  </p>
                )}
              </div>
            )}
            
            <p className="mobile-instructions">
              After clicking Download, follow the on-screen instructions to save to your photos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ToolsPage; 