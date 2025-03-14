import React, { useState, useEffect, useRef } from 'react';
import './RoutePlanner.css';

// Add this dark mode map style array near your other constants
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

// Add these variables at the top of your file
let mapInitAttempts = 0;
const MAX_MAP_INIT_ATTEMPTS = 3;

// Add this function to detect browser and platform
const detectBrowser = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Detect platform
  const isIOS = /iPhone|iPad|iPod/.test(userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(userAgent);
  
  // Detect browser
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
  const isSafari = /Safari/.test(userAgent) && /Apple Computer/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(userAgent);
  const isEdge = /Edg/.test(userAgent);
  
  return {
    isIOS,
    isAndroid,
    isChrome,
    isSafari,
    isFirefox,
    isEdge,
    isMobile: isIOS || isAndroid
  };
};

// Use environment variable for Google Maps API key

// Replace direct API key usage with environment variable
const loadGoogleMapsWithRetry = (callback, retries = 3) => {
  // Check if Google Maps is already loaded
  if (window.google && window.google.maps && window.google.maps.visualization) {
    console.log('Google Maps API already loaded');
    callback();
    return;
  }
  
  console.log(`Loading Google Maps API (attempts left: ${retries})...`);
  
  // Create a global callback function
  window.initGoogleMapsCallback = () => {
    console.log('Google Maps API loaded successfully');
    // Small delay to ensure visualization library is fully loaded
    setTimeout(() => {
      if (window.google && window.google.maps && window.google.maps.visualization) {
        callback();
      } else {
        console.error('Google Maps loaded but visualization library missing');
        if (retries > 0) {
          loadGoogleMapsWithRetry(callback, retries - 1);
        }
      }
    }, 1000);
  };
  
  // Remove any existing script tags to avoid conflicts
  const existingScript = document.getElementById('google-maps-api');
  if (existingScript) {
    existingScript.remove();
  }
  
  // Use environment variable for API key
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  
  // Create and append the script tag with async loading
  const script = document.createElement('script');
  script.id = 'google-maps-api';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization,places,drawing&callback=initGoogleMapsCallback&loading=async`;
  script.async = true;
  script.defer = true;
  script.onerror = (error) => {
    console.error('Error loading Google Maps API:', error);
    if (retries > 0) {
      setTimeout(() => loadGoogleMapsWithRetry(callback, retries - 1), 2000);
    }
  };
  
  document.head.appendChild(script);
};

// Add this at the top of your component, outside any functions
let globalMapInstance = null;
let globalCredentials = null;

function RoutePlanner() {
  // Detect browser once when component mounts
  const [browserInfo] = useState(detectBrowser);
  
  // Log browser detection info
  useEffect(() => {
    console.log('Browser detection:', browserInfo);
  }, [browserInfo]);
  
  // State for WiGLE credentials
  const [credentials, setCredentials] = useState(() => {
    const savedCredentials = localStorage.getItem('wigleCredentials');
    const parsedCredentials = savedCredentials ? JSON.parse(savedCredentials) : {
      username: '',
      apiToken: ''
    };
    
    // Store in global variable for access from event handlers
    globalCredentials = parsedCredentials;
    
    return parsedCredentials;
  });
  
  // Update global credentials when state changes
  useEffect(() => {
    globalCredentials = credentials;
  }, [credentials]);
  
  // State for map data
  const [wigleData, setWigleData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [route, setRoute] = useState([]);
  
  // Map reference
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Handle credential changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => {
      const newCredentials = {
        ...prev,
        [name]: value
      };
      
      // Update global reference
      globalCredentials = newCredentials;
      
      localStorage.setItem('wigleCredentials', JSON.stringify(newCredentials));
      return newCredentials;
    });
  };
  
  // Now modify your existing useEffect that loads the map
  useEffect(() => {
    // Replace your existing map loading code with this
    loadGoogleMapsWithRetry(() => {
      if (mapContainerRef.current) {
        initMap();
      }
    });
    
    return () => {
      // Cleanup
      if (window.initGoogleMapsCallback) {
        window.initGoogleMapsCallback = null;
      }
    };
  }, []);
  
  // Fix for iOS Firefox width issue
  useEffect(() => {
    if (browserInfo.isIOS && browserInfo.isFirefox) {
      console.log('Applying iOS Firefox fixes');
      
      // Fix viewport
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      } else {
        const newMeta = document.createElement('meta');
        newMeta.name = 'viewport';
        newMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(newMeta);
      }
      
      // Fix width issues
      document.documentElement.style.width = '100%';
      document.body.style.width = '100%';
      document.body.style.overflowX = 'hidden';
      
      // Force layout recalculation
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 500);
    }
    
    return () => {
      // Cleanup
      if (browserInfo.isIOS && browserInfo.isFirefox) {
        document.documentElement.style.width = '';
        document.body.style.width = '';
        document.body.style.overflowX = '';
      }
    };
  }, [browserInfo]);
  
  // Fix map size issue - restore original dimensions
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .fullscreen-loading-message {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        z-index: 10000;
        max-width: 80%;
        text-align: center;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }
      
      .fullscreen-loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        margin-right: 10px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #0CC400;
        animation: spin 1s ease-in-out infinite;
        vertical-align: middle;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      /* Restore map to 70vh height */
      .map-container {
        width: 100% !important;
        height: 70vh !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .map-container-wrapper {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
  // Modify the initMap function for better browser compatibility
  const initMap = () => {
    if (!mapContainerRef.current) return;
    if (map) {
      console.log('Map already initialized, skipping');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Initializing map...');
    
    try {
      // Make sure Google Maps API is loaded
      if (!window.google || !window.google.maps) {
        console.error('Google Maps API not loaded');
        setLoadingMessage('Error: Google Maps API not loaded. Please refresh the page.');
        return;
      }
      
      console.log(`Device detection - iOS: ${browserInfo.isIOS}, Firefox: ${browserInfo.isFirefox}, Android: ${browserInfo.isAndroid}`);
      
      // Create map instance with appropriate options
      const mapInstance = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 12,
        mapTypeId: 'roadmap',
        fullscreenControl: true,
        streetViewControl: false,
        mapTypeControl: true,
        zoomControl: true,
        styles: darkMapStyle
      });
      
      // Store map reference
      setMap(mapInstance);
      globalMapInstance = mapInstance;
      
      // Add custom fullscreen control for iOS
      if (browserInfo.isIOS) {
        console.log('Adding custom fullscreen button for iOS');
        
        const fullscreenControlDiv = document.createElement('div');
        fullscreenControlDiv.className = 'custom-fullscreen-control';
        fullscreenControlDiv.title = 'Toggle fullscreen';
        fullscreenControlDiv.innerHTML = `
          <button style="
            background: white;
            border: 2px solid #0CC400;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
            margin: 10px;
            padding: 5px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
          </button>
        `;
        
        fullscreenControlDiv.addEventListener('click', () => {
          const mapDiv = mapContainerRef.current;
          
          try {
            // iOS-specific fullscreen implementation
            if (browserInfo.isIOS) {
              // Toggle a class that makes the map container take over the screen
              document.body.classList.toggle('map-fullscreen-mode');
              
              if (document.body.classList.contains('map-fullscreen-mode')) {
                // Save original styles
                mapDiv.dataset.originalHeight = mapDiv.style.height;
                mapDiv.dataset.originalPosition = mapDiv.style.position;
                
                // Apply fullscreen styles
                document.body.style.overflow = 'hidden';
                mapDiv.style.position = 'fixed';
                mapDiv.style.top = '0';
                mapDiv.style.left = '0';
                mapDiv.style.width = '100%';
                mapDiv.style.height = '100%';
                mapDiv.style.zIndex = '9999';
                
                // Add a close button
                const closeButton = document.createElement('button');
                closeButton.id = 'exit-fullscreen-btn';
                closeButton.innerHTML = '✕';
                closeButton.style.position = 'fixed';
                closeButton.style.top = '10px';
                closeButton.style.right = '10px';
                closeButton.style.zIndex = '10000';
                closeButton.style.background = '#0CC400';
                closeButton.style.color = 'white';
                closeButton.style.border = 'none';
                closeButton.style.borderRadius = '50%';
                closeButton.style.width = '40px';
                closeButton.style.height = '40px';
                closeButton.style.fontSize = '20px';
                closeButton.style.fontWeight = 'bold';
                closeButton.style.cursor = 'pointer';
                closeButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
                
                closeButton.addEventListener('click', () => {
                  document.body.classList.remove('map-fullscreen-mode');
                  document.body.style.overflow = '';
                  mapDiv.style.position = mapDiv.dataset.originalPosition || '';
                  mapDiv.style.top = '';
                  mapDiv.style.left = '';
                  mapDiv.style.width = '100%';
                  mapDiv.style.height = mapDiv.dataset.originalHeight || '400px';
                  mapDiv.style.zIndex = '';
                  
                  document.body.removeChild(closeButton);
                  
                  // Force resize to update map
                  window.dispatchEvent(new Event('resize'));
                  setTimeout(() => {
                    if (mapInstance) {
                      const center = mapInstance.getCenter();
                      mapInstance.setCenter(center);
                    }
                  }, 100);
                });
                
                document.body.appendChild(closeButton);
              } else {
                // Restore original styles
                document.body.style.overflow = '';
                mapDiv.style.position = mapDiv.dataset.originalPosition || '';
                mapDiv.style.top = '';
                mapDiv.style.left = '';
                mapDiv.style.width = '100%';
                mapDiv.style.height = mapDiv.dataset.originalHeight || '400px';
                mapDiv.style.zIndex = '';
                
                // Remove close button if it exists
                const closeButton = document.getElementById('exit-fullscreen-btn');
                if (closeButton) {
                  document.body.removeChild(closeButton);
                }
              }
              
              // Force resize to update map
              window.dispatchEvent(new Event('resize'));
              setTimeout(() => {
                if (mapInstance) {
                  const center = mapInstance.getCenter();
                  mapInstance.setCenter(center);
                }
              }, 100);
            }
          } catch (error) {
            console.error('Fullscreen error:', error);
            alert('Fullscreen mode not supported in this browser.');
          }
        });
        
        // Position the button at the top right of the map
        mapInstance.controls[window.google.maps.ControlPosition.TOP_RIGHT].push(fullscreenControlDiv);
      }
      
      // Fix location button to ensure it appears on all platforms
      console.log('Adding location button to map...');
      const locationButtonDiv = document.createElement('div');
      locationButtonDiv.className = 'custom-location-button';
      locationButtonDiv.title = 'Show your location';
      locationButtonDiv.innerHTML = `
        <button style="
          background: white;
          border: 2px solid #0CC400;
          border-radius: 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          margin: 10px;
          padding: 8px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0CC400" stroke-width="2.5">
            <circle cx="12" cy="12" r="8"></circle>
            <circle cx="12" cy="12" r="3" fill="#0CC400"></circle>
          </svg>
        </button>
      `;
      
      // Add click handler for the location button
      locationButtonDiv.querySelector('button').addEventListener('click', () => {
        console.log('Location button clicked');
        if (navigator.geolocation) {
          showLoadingMessage('Getting your location...');
          
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              
              console.log(`Location obtained: ${pos.lat}, ${pos.lng}`);
              mapInstance.setCenter(pos);
              mapInstance.setZoom(15); // Zoom in when location is found
              showLoadingMessage('Location found!');
              
              // Add marker for user location
              new window.google.maps.Marker({
                position: pos,
                map: mapInstance,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: "#0CC400",
                  fillOpacity: 0.8,
                  strokeWeight: 2,
                  strokeColor: "#FFFFFF"
                },
                title: "Your Location"
              });
              
              setTimeout(() => showLoadingMessage(''), 2000);
            },
            (error) => {
              console.error("Error getting location:", error);
              showLoadingMessage(`Error getting location: ${error.message}`);
              setTimeout(() => showLoadingMessage(''), 3000);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        } else {
          showLoadingMessage("Geolocation is not supported by this browser.");
          setTimeout(() => showLoadingMessage(''), 3000);
        }
      });
      
      // Position the button at the right side of the map
      // Use RIGHT_BOTTOM for better visibility
      mapInstance.controls[window.google.maps.ControlPosition.RIGHT_BOTTOM].push(locationButtonDiv);
      console.log('Location button added to map');
      
      // Add in-map fetch button
      const mapFetchButtonDiv = document.createElement('div');
      mapFetchButtonDiv.innerHTML = `
        <button style="
          background: #0CC400;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          margin: 10px;
          font-size: 14px;
          font-weight: bold;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          <span style="margin-right: 5px;">📡</span> Fetch WiGLE Data
        </button>
      `;
      
      // Add click handler for the fetch button
      mapFetchButtonDiv.querySelector('button').addEventListener('click', () => {
        // Special handling for Firefox
        if (browserInfo.isFirefox) {
          // Make sure map bounds are available
          if (!mapInstance.getBounds()) {
            setLoadingMessage('Map bounds not available yet. Please wait a moment and try again.');
            
            // Force map to recalculate bounds
            const center = mapInstance.getCenter();
            const currentZoom = mapInstance.getZoom();
            mapInstance.setZoom(currentZoom - 1);
            setTimeout(() => {
              mapInstance.setZoom(currentZoom);
              mapInstance.setCenter(center);
              
              // Try again after forcing bounds recalculation
              setTimeout(() => {
                if (mapInstance.getBounds()) {
                  fetchWigleData();
                } else {
                  setLoadingMessage('Still unable to get map bounds. Please try refreshing the page.');
                }
              }, 500);
            }, 300);
            
            return;
          }
        }
        
        // Call the main fetch function
        fetchWigleData();
      });
      
      // Position the button at the bottom left of the map
      mapInstance.controls[window.google.maps.ControlPosition.BOTTOM_LEFT].push(mapFetchButtonDiv);
      
      // Special handling for Firefox
      if (browserInfo.isFirefox) {
        console.log("Firefox detected - using special initialization");
        
        // Force multiple resize events to ensure map renders properly
        const forceResize = () => {
          window.dispatchEvent(new Event('resize'));
          if (mapInstance && mapInstance.getCenter) {
            const center = mapInstance.getCenter();
            mapInstance.setCenter(center);
          }
        };
        
        // Schedule multiple resize attempts
        setTimeout(forceResize, 500);
        setTimeout(forceResize, 1500);
        setTimeout(forceResize, 3000);
      }
      
      // Add event listener for when map is fully loaded
      window.google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
        setIsLoading(false);
        console.log('Map fully loaded and ready');
        
        // Hide loading message
        setLoadingMessage('');
        
        // Force bounds calculation
        if (mapInstance && !mapInstance.getBounds()) {
          console.log('Forcing bounds calculation...');
          const center = mapInstance.getCenter();
          const currentZoom = mapInstance.getZoom();
          
          // Zoom in and out to force bounds calculation
          mapInstance.setZoom(currentZoom - 1);
          setTimeout(() => {
            mapInstance.setZoom(currentZoom);
            mapInstance.setCenter(center);
          }, 200);
        }
      });
      
      // Try to get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            
            console.log(`Location obtained: ${pos.lat}, ${pos.lng}`);
            mapInstance.setCenter(pos);
            
            // Add marker for user location
            new window.google.maps.Marker({
              position: pos,
              map: mapInstance,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#0CC400",
                fillOpacity: 0.8,
                strokeWeight: 2,
                strokeColor: "#FFFFFF"
              },
              title: "Your Location"
            });
            
            setIsLoading(false);
          },
          (error) => {
            console.error("Error getting location:", error);
            setIsLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error('Error initializing map:', error);
      setLoadingMessage('Error initializing map. Please refresh the page.');
      setIsLoading(false);
      
      // Retry if we haven't exceeded max attempts
      if (mapInitAttempts < MAX_MAP_INIT_ATTEMPTS) {
        setTimeout(initMap, 2000);
      }
    }
  };
  
  // Function to visualize data (called after map is initialized and data is loaded)
  const visualizeData = (data) => {
    if (!map || !data || data.length === 0) {
      console.error('Map or data not available');
      return;
    }
    
    try {
      // Make sure map is fully loaded before accessing bounds
      if (!map.getBounds()) {
        console.log('Map bounds not available yet, waiting...');
        window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          visualizeData(data);
        });
        return;
      }
      
      // Create heatmap layer
      const heatmapData = data.map(point => {
        return new window.google.maps.LatLng(point.lat, point.lng);
      });
      
      const heatmapLayer = new window.google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: map,
        radius: 20
      });
      
      setHeatmap(heatmapLayer);
      
    } catch (error) {
      console.error('Error visualizing data:', error);
      setLoadingMessage('Error visualizing data.');
    }
  };
  
  // Improved snapToRoads function with zoom-level awareness
  const snapToRoads = async (points) => {
    // Get current zoom level
    const zoomLevel = map.getZoom();
    
    // Adjust parameters based on zoom level
    const MIN_DISTANCE = zoomLevel >= 16 ? 5 : (zoomLevel >= 14 ? 10 : 20); // meters
    const CONNECTION_THRESHOLD = zoomLevel >= 16 ? 20 : (zoomLevel >= 14 ? 30 : 50); // meters
    
    // We need to limit the number of points per request due to API limits
    const MAX_POINTS_PER_REQUEST = 100;
    let snappedPoints = [];
    
    // First, let's clean up the points to remove any that are too close together
    const cleanedPoints = [];
    let lastPoint = null;
    
    // Filter points that are too close together
    for (const point of points) {
      if (!lastPoint) {
        cleanedPoints.push(point);
        lastPoint = point;
        continue;
      }
      
      // Calculate distance between points (rough approximation)
      const distance = Math.sqrt(
        Math.pow((point.lat - lastPoint.lat) * 111000, 2) + 
        Math.pow((point.lng - lastPoint.lng) * 111000 * Math.cos(lastPoint.lat * Math.PI/180), 2)
      );
      
      // Only keep points that are at least MIN_DISTANCE meters apart
      if (distance > MIN_DISTANCE) {
        cleanedPoints.push(point);
        lastPoint = point;
      }
    }
    
    console.log(`Reduced ${points.length} points to ${cleanedPoints.length} points`);
    
    // Process points in chunks
    for (let i = 0; i < cleanedPoints.length; i += MAX_POINTS_PER_REQUEST) {
      const chunk = cleanedPoints.slice(i, i + MAX_POINTS_PER_REQUEST);
      
      // Create the path parameter for the Roads API
      const pathParam = chunk.map(point => `${point.lat},${point.lng}`).join('|');
      
      try {
        setLoadingMessage(`Snapping points to roads (${i+1}-${Math.min(i+MAX_POINTS_PER_REQUEST, cleanedPoints.length)} of ${cleanedPoints.length})...`);
        
        // Call the Roads API to snap points to roads
        const response = await fetch(
          `https://roads.googleapis.com/v1/snapToRoads?path=${pathParam}&interpolate=true&key=AIzaSyC39qFGmCOo3FSV2AAYJMoR-OtspiPjkuU`,
          { method: 'GET' }
        );
        
        const data = await response.json();
        
        if (data.snappedPoints) {
          // Add the snapped points to our result
          const newPoints = data.snappedPoints.map(point => ({
            lat: point.location.latitude,
            lng: point.location.longitude,
            placeId: point.placeId,
            originalIndex: i + (point.originalIndex || 0)
          }));
          
          snappedPoints = [...snappedPoints, ...newPoints];
        }
      } catch (error) {
        console.error('Error snapping points to roads:', error);
        return cleanedPoints;
      }
    }
    
    // Sort the snapped points by their original index
    snappedPoints.sort((a, b) => a.originalIndex - b.originalIndex);
    
    // Group points by placeId to create road segments
    const roadSegments = [];
    let currentSegment = [];
    let currentPlaceId = null;
    
    for (let i = 0; i < snappedPoints.length; i++) {
      const point = snappedPoints[i];
      
      if (point.placeId !== currentPlaceId) {
        if (currentSegment.length > 0) {
          roadSegments.push([...currentSegment]);
        }
        currentSegment = [{lat: point.lat, lng: point.lng}];
        currentPlaceId = point.placeId;
      } else {
        currentSegment.push({lat: point.lat, lng: point.lng});
      }
    }
    
    if (currentSegment.length > 0) {
      roadSegments.push([...currentSegment]);
    }
    
    return roadSegments;
  };
  
  // Improve geolocation handling for mobile browsers
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    
    // Options with longer timeout for mobile
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`Location obtained: ${latitude}, ${longitude}`);
        
        if (map) {
          map.setCenter({ lat: latitude, lng: longitude });
          map.setZoom(15);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        
        let errorMessage = 'Failed to get your location. ';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage += 'You denied the request for location. Please enable location services in your browser settings.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case err.TIMEOUT:
            errorMessage += 'The request to get your location timed out.';
            break;
          default:
            errorMessage += `Unknown error (${err.message}).`;
        }
        
        setError(errorMessage);
      },
      options
    );
  };
  
  // Fix fetch WiGLE data for mobile browsers
  const fetchWigleData = async () => {
    console.log('fetchWigleData called');
    
    if (!map && !globalMapInstance) {
      setError('Map not initialized');
      return;
    }
    
    // Use either the React state or global reference
    const mapToUse = map || globalMapInstance;
    const credsToUse = credentials || globalCredentials;
    
    if (!credsToUse.username || !credsToUse.apiToken) {
      setError('Please enter your WiGLE API credentials');
      return;
    }
    
    const bounds = mapToUse.getBounds();
    if (!bounds) {
      setError('Map bounds not available');
      return;
    }
    
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Fetching WiGLE data...');
    
    try {
      // Create the Basic Authentication token
      const authToken = btoa(`${credsToUse.username}:${credsToUse.apiToken}`);
      
      // Build the query with all necessary parameters
      const queryParams = new URLSearchParams({
        onlymine: 'true',
        latrange1: sw.lat(),
        latrange2: ne.lat(),
        longrange1: sw.lng(),
        longrange2: ne.lng(),
        searchWifi: 'true',
        searchBluetooth: 'true',
        searchCell: 'true',
        resultsPerPage: 1000
      });
      
      // Log the request URL for debugging
      console.log(`Fetching from: https://api.wigle.net/api/v2/network/search?${queryParams}`);
      
      // First request to get total count and first page - add credentials mode for mobile browsers
      const response = await fetch(`https://api.wigle.net/api/v2/network/search?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Accept': 'application/json'
        },
        // Add credentials mode for iOS browsers
        credentials: 'same-origin'
      });
      
      // Log response status for debugging
      console.log(`Response status: ${response.status}`);
      
      const data = await response.json();
      
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Failed to fetch WiGLE data');
      }
      
      // Initialize results array with first page
      let allResults = data.results || [];
      
      // Check if there are more pages
      const totalResults = data.totalResults || 0;
      console.log(`WiGLE data: ${allResults.length} of ${totalResults} total results`);
      
      // Fetch additional pages if needed (up to 10 pages to avoid excessive requests)
      const maxPages = Math.min(10, Math.ceil(totalResults / 1000));
      
      if (maxPages > 1) {
        setLoadingMessage(`Fetching additional data (page 1 of ${maxPages})...`);
        
        for (let page = 1; page < maxPages; page++) {
          // Update query params with page number
          queryParams.set('first', page * 1000);
          
          setLoadingMessage(`Fetching additional data (page ${page+1} of ${maxPages})...`);
          
          try {
            const pageResponse = await fetch(`https://api.wigle.net/api/v2/network/search?${queryParams}`, {
              method: 'GET',
              headers: {
                'Authorization': `Basic ${authToken}`,
                'Accept': 'application/json'
              },
              credentials: 'same-origin'
            });
            
            const pageData = await pageResponse.json();
            
            if (pageResponse.ok && pageData.success && pageData.results) {
              allResults = [...allResults, ...pageData.results];
              console.log(`Added ${pageData.results.length} results from page ${page+1}`);
            } else {
              console.warn(`Failed to fetch page ${page+1}`);
              break;
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (pageError) {
            console.error(`Error fetching page ${page+1}:`, pageError);
            break;
          }
        }
      }
      
      console.log(`Total WiGLE data fetched: ${allResults.length} points`);
      
      if (allResults.length === 0) {
        setError('No WiGLE data found in this area. Try zooming out or moving the map.');
        setIsLoading(false);
        return;
      }
      
      // Clear previous markers if any
      if (window.wigleMarkers) {
        window.wigleMarkers.forEach(marker => marker.setMap(null));
      }
      window.wigleMarkers = [];
      
      // Clear previous heatmap if any
      if (window.heatmapLayer) {
        window.heatmapLayer.setMap(null);
      }
      
      // Transform data for heatmap with higher weight
      const heatmapData = allResults.map(network => ({
        location: new window.google.maps.LatLng(network.trilat, network.trilong),
        weight: 3 // Higher weight for better visibility
      }));
      
      setWigleData(heatmapData);
      
      // Create heatmap layer with adjusted settings for better linear appearance
      window.heatmapLayer = new window.google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: mapToUse,
        radius: 15, // Reduced from original 15
        opacity: 0.7, // Reduced from original 0.7
        maxIntensity: 8, // Adjusted for more color variation
        dissipating: true,
        gradient: [
          'rgba(0, 0, 255, 0)',    // transparent -> blue
          'rgba(0, 0, 255, 0.5)',  // blue
          'rgba(0, 255, 255, 0.6)', // cyan
          'rgba(0, 255, 0, 0.7)',  // green
          'rgba(255, 255, 0, 0.8)', // yellow
          'rgba(255, 165, 0, 0.9)', // orange
          'rgba(255, 0, 0, 1)'     // red
        ]
      });
      
      // Define the updateHeatmapSettings function
      window.updateHeatmapSettings = () => {
        if (!mapToUse || !window.heatmapLayer) return;
        
        const zoom = mapToUse.getZoom();
        console.log(`Zoom level: ${zoom}`);
        
        // Set explicit radius values for each zoom level
        let radius;
        
        // Keep full size for zoom 13+
        if (zoom >= 13) {
          radius = 15;
        } 
        // Explicit values for each zoom level from 12 down to 0
        else if (zoom === 13) { radius = 9; }
        else if (zoom === 12) { radius = 10; }
        else if (zoom === 11) { radius = 6; }
        else if (zoom === 10) { radius = 3; }
        else if (zoom === 9) { radius = 1.5; }
        else if (zoom === 8) { radius = 0.8; }
        else if (zoom === 7) { radius = 0.4; }
        else if (zoom === 6) { radius = 0.2; }
        else { radius = 0.1; } // zoom levels 0-5
        
        // Set explicit opacity values for each zoom level
        let opacity;
        
        // Keep full opacity for zoom 13+
        if (zoom >= 13) {
          opacity = 0.7;
        }
        // Explicit values for each zoom level from 12 down to 0
        else if (zoom === 12) { opacity = 0.6; }
        else if (zoom === 11) { opacity = 0.5; }
        else if (zoom === 10) { opacity = 0.4; }
        else if (zoom === 9) { opacity = 0.3; }
        else if (zoom === 8) { opacity = 0.2; }
        else { opacity = 0.1; } // zoom levels 0-7
        
        // Set explicit maxIntensity values for each zoom level
        let maxIntensity;
        
        // Keep normal maxIntensity for zoom 13+
        if (zoom >= 13) {
          maxIntensity = 8;
        }
        // Explicit values for each zoom level from 12 down to 0
        else if (zoom === 12) { maxIntensity = 15; }
        else if (zoom === 11) { maxIntensity = 25; }
        else if (zoom === 10) { maxIntensity = 40; }
        else if (zoom === 9) { maxIntensity = 60; }
        else if (zoom === 8) { maxIntensity = 80; }
        else { maxIntensity = 100; } // zoom levels 0-7
        
        // Update heatmap settings
        window.heatmapLayer.set('radius', radius);
        window.heatmapLayer.set('opacity', opacity);
        window.heatmapLayer.set('maxIntensity', maxIntensity);
        
        console.log(`UPDATED HEATMAP: radius=${radius.toFixed(1)}, opacity=${opacity.toFixed(2)}, maxIntensity=${maxIntensity.toFixed(1)}`);
      };
      
      // Add zoom change listener to update heatmap settings
      mapToUse.addListener('zoom_changed', () => {
        window.updateHeatmapSettings();
      });
      
      // Add actual points for more accurate visualization
      allResults.forEach(network => {
        const marker = new window.google.maps.Marker({
          position: { lat: network.trilat, lng: network.trilong },
          map: mapToUse,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 4, // Larger points
            fillColor: '#FF0000', // Red color for better visibility
            fillOpacity: 0.8,
            strokeWeight: 1,
            strokeColor: '#FFFFFF'
          },
          visible: false // Initially hidden
        });
        
        window.wigleMarkers.push(marker);
      });
      
      // Remove existing visualization control if it exists
      if (window.visualizationControlAdded) {
        const existingControl = document.querySelector('.visualization-control');
        if (existingControl && existingControl.parentNode) {
          existingControl.parentNode.removeChild(existingControl);
        }
        window.visualizationControlAdded = false;
      }
      
      // Add simplified visualization controls - only heatmap and points
      const visualizationControl = document.createElement('div');
      visualizationControl.className = 'visualization-control';
      visualizationControl.innerHTML = `
        <button id="toggle-heatmap">Heatmap</button>
        <button id="toggle-points">Points</button>
      `;
      
      mapToUse.controls[window.google.maps.ControlPosition.TOP_RIGHT].push(visualizationControl);
      
      document.getElementById('toggle-heatmap').addEventListener('click', () => {
        window.heatmapLayer.setMap(mapToUse);
        window.wigleMarkers.forEach(marker => marker.setVisible(false));
      });
      
      document.getElementById('toggle-points').addEventListener('click', () => {
        window.heatmapLayer.setMap(null);
        window.wigleMarkers.forEach(marker => marker.setVisible(true));
      });
      
      window.visualizationControlAdded = true;
      
      setLoadingMessage(`Loaded ${allResults.length} networks`);
      setTimeout(() => setLoadingMessage(''), 2000);
      
    } catch (error) {
      console.error('Error fetching WiGLE data:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start route creation
  const startRouteCreation = () => {
    window.creatingRoute = true;
    setRoute([]);
    
    // Clear existing route markers and polyline
    if (window.routeMarkers) {
      window.routeMarkers.forEach(marker => marker.setMap(null));
    }
    
    if (window.routePolyline) {
      window.routePolyline.setMap(null);
    }
    
    window.routeMarkers = [];
    window.routePolyline = new window.google.maps.Polyline({
      path: [],
      geodesic: true,
      strokeColor: '#0CC400',
      strokeOpacity: 0.8,
      strokeWeight: 5,
      map: map
    });
  };
  
  // Add a point to the route
  const addRoutePoint = (lat, lng) => {
    const newPoint = { lat, lng };
    setRoute(prev => [...prev, newPoint]);
    
    // Add marker
    const marker = new window.google.maps.Marker({
      position: newPoint,
      map: map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: '#0CC400',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#FFFFFF'
      }
    });
    
    window.routeMarkers.push(marker);
    
    // Update polyline
    const path = window.routePolyline.getPath();
    path.push(new window.google.maps.LatLng(lat, lng));
  };
  
  // Finish route creation
  const finishRouteCreation = () => {
    window.creatingRoute = false;
  };
  
  // Clear the route
  const clearRoute = () => {
    setRoute([]);
    
    // Clear markers and polyline
    if (window.routeMarkers) {
      window.routeMarkers.forEach(marker => marker.setMap(null));
      window.routeMarkers = [];
    }
    
    if (window.routePolyline) {
      window.routePolyline.setPath([]);
    }
    
    window.creatingRoute = false;
  };
  
  // Generate deep link for Google Maps
  const generateGoogleMapsLink = () => {
    if (route.length < 2) return { iosLink: '#', androidLink: '#', webLink: '#' };
    
    const origin = `${route[0].lat},${route[0].lng}`;
    const destination = `${route[route.length - 1].lat},${route[route.length - 1].lng}`;
    
    let waypoints = '';
    if (route.length > 2) {
      const waypointsList = route.slice(1, -1).map(point => `${point.lat},${point.lng}`).join('|');
      waypoints = `&waypoints=${waypointsList}`;
    }
    
    // Create deep links for both platforms
    const iosLink = `comgooglemaps://?saddr=${origin}&daddr=${destination}${waypoints}&directionsmode=driving`;
    const androidLink = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints}&travelmode=driving`;
    const webLink = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints}&travelmode=driving`;
    
    return { iosLink, androidLink, webLink };
  };
  
  // Add this to the useEffect hook
  useEffect(() => {
    // Hide Google Maps error message
    const hideGoogleMapsError = () => {
      const interval = setInterval(() => {
        const alertDiv = document.querySelector('.dismissButton');
        if (alertDiv) {
          alertDiv.click();
          clearInterval(interval);
        }
      }, 100);
      
      setTimeout(() => clearInterval(interval), 5000);
    };
    
    hideGoogleMapsError();
    
    // Rest of your existing code...
  }, []);
  
  // Update the point styling to be smaller, solid red dots without borders
  const createMarkerIcon = (color = '#FF0000') => {
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1.0,
      scale: 3, // Smaller size (was likely larger before)
      strokeWeight: 0, // No border/outline
      strokeColor: color,
      strokeOpacity: 0 // Completely transparent stroke
    };
  };
  
  // If you have a function that creates markers, update it to use this icon
  // For example, if you have code like this:
  const createMarker = (position, title, color) => {
    return new window.google.maps.Marker({
      position,
      map,
      title,
      icon: createMarkerIcon(color || '#FF0000'), // Default to red if no color specified
      visible: true
    });
  };
  
  // Fix the undefined showLoadingMessage function

  // Add this function definition before using it
  const showLoadingMessage = (message) => {
    // Update the state
    setLoadingMessage(message);
    
    // Remove any existing fullscreen message
    const existingMessage = document.querySelector('.fullscreen-loading-message');
    if (existingMessage) {
      document.body.removeChild(existingMessage);
    }
    
    // If there's a message to show
    if (message) {
      // Create a new message element
      const messageEl = document.createElement('div');
      messageEl.className = 'fullscreen-loading-message';
      messageEl.innerHTML = `
        <div class="fullscreen-loading-spinner"></div>
        <span>${message}</span>
      `;
      
      // Add to the document
      document.body.appendChild(messageEl);
      
      // Auto-hide after 5 seconds unless it's a persistent message
      if (!message.includes('Error') && !message.includes('Please wait')) {
        setTimeout(() => {
          if (document.body.contains(messageEl)) {
            document.body.removeChild(messageEl);
          }
        }, 5000);
      }
    }
  };
  
  return (
    
    <div className="page-content route-planner">
      <h2>Route Planner</h2>
      <p>Create custom routes using WiGLE coverage data.</p>
      
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
        <button 
          className="fetch-button" 
          onClick={fetchWigleData}
          disabled={isLoading || (!credentials.username || !credentials.apiToken)}
        >
          {isLoading ? 'Loading...' : 'Fetch WiGLE Data'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="map-container-wrapper">
        <div className="map-container" ref={mapContainerRef}>
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>{loadingMessage}</p>
            </div>
          )}
        </div>
      </div>
      
  
    </div>
  );
}

export default RoutePlanner;
