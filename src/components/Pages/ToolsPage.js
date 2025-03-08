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
      const canvas = await html2canvas(calendarRef.current, {
        backgroundColor: '#121212',
        scale: 2, // Higher resolution
        logging: false,
        useCORS: true
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `wigle-stats-${credentials.displayName || 'user'}.png`;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
      setError('Failed to generate image');
    }
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
      <h2>WiGLE Stats Badge Generator</h2>
      <p>Create a shareable image showing your WiGLE contribution activity.</p>
      
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
            <label htmlFor="displayName">Display Name (optional)</label>
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
          </div>
        )}
      </div>
    </div>
  );
}

export default ToolsPage; 