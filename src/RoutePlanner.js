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

// Modified loadGoogleMapsWithRetry function
const loadGoogleMapsWithRetry = (callback, retries = 3) => {
  // Check if Google Maps is already loaded and fully initialized
  if (window.google && window.google.maps && window.google.maps.visualization) {
    console.log('Google Maps API already loaded and initialized');
    callback();
    return;
  }

  console.log(`Loading Google Maps API (attempts left: ${retries})...`);

  // Create a unique callback name
  const callbackName = `initGoogleMaps_${Date.now()}`;

  // Define the callback function before creating the script
  window[callbackName] = function() {
    console.log('Google Maps API loaded, waiting for visualization library...');
    // Check if visualization library is loaded
    const checkVisualization = setInterval(() => {
      if (window.google && window.google.maps && window.google.maps.visualization) {
        clearInterval(checkVisualization);
        console.log('Visualization library loaded');
        callback();
      }
    }, 100);

    // Set a timeout to prevent infinite checking
    setTimeout(() => {
      clearInterval(checkVisualization);
      if (!window.google?.maps?.visualization && retries > 0) {
        console.log('Visualization library failed to load, retrying...');
        loadGoogleMapsWithRetry(callback, retries - 1);
      }
    }, 5000);
  };

  // Remove any existing Google Maps scripts
  const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
  existingScripts.forEach(script => script.remove());

  // Create and append the new script
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=visualization,places,drawing&callback=${callbackName}`;
  script.async = true;
  script.onerror = () => {
    console.error('Failed to load Google Maps API');
    if (retries > 0) {
      setTimeout(() => loadGoogleMapsWithRetry(callback, retries - 1), 2000);
    }
  };

  document.head.appendChild(script);
};

// Add this at the top of your component, outside any functions
let globalMapInstance = null;
let globalCredentials = null;

// Add these constants at the top of the file
const TILE_SIZE = 0.01; // Approximately 1km tiles
const MAX_CONCURRENT_REQUESTS = 3; // Limit concurrent API calls

// Add these constants near the top of the file
const LOCAL_STORAGE_KEY = 'wigleMapData';
const MAX_STORAGE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Add these constants at the top of the file
const INITIAL_BACKOFF = 2000; // 2 seconds
const MAX_BACKOFF = 30000; // 30 seconds
const MAX_RETRIES = 3;

// Add this function near the top of your file
const getHeatmapRadius = (zoomLevel) => {
  // Base radius starts smaller and increases with zoom level
  const baseRadius = Math.max(2, Math.min(30, zoomLevel * 1.5));
  
  // Adjust radius based on zoom ranges
  if (zoomLevel >= 18) return baseRadius;
  if (zoomLevel >= 16) return baseRadius * 0.8;
  if (zoomLevel >= 14) return baseRadius * 0.6;
  if (zoomLevel >= 12) return baseRadius * 0.4;
  if (zoomLevel >= 10) return baseRadius * 0.3;
  if (zoomLevel >= 8) return baseRadius * 0.2;
  return baseRadius * 0.1; // For very zoomed out views
};

const getAdaptiveTileSize = (map) => {
  const zoom = map.getZoom();
  if (zoom >= 17) return 0.002;
  if (zoom >= 15) return 0.005;
  if (zoom >= 13) return 0.01;
  if (zoom >= 10) return 0.02;
  return 0.05;
};

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
  
  // Update the createLocationButton function to ensure it's added to the map
  const createLocationButton = (map) => {
    const locationButton = document.createElement('div');
    locationButton.className = 'custom-map-control';
    
    const button = document.createElement('button');
    button.className = 'my-location-button';
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 2v3m0 14v3m-9-9H2m19 0h-3"></path>
      </svg>
    `;
    button.title = "Center on my location";
    
    locationButton.appendChild(button);
    
    // Position the button in the top-left corner
    map.controls[window.google.maps.ControlPosition.LEFT_TOP].push(locationButton);
    
    button.addEventListener('click', () => {
      button.classList.add('loading');
      getUserLocation(map, true);
    });
    
    // Store button reference to update its state
    window.locationButton = button;
    
    return button;
  };

  // Update the getUserLocation function
  const getUserLocation = (map, centerMap = false) => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      setError('Geolocation is not supported by your browser');
      return;
    }

    // Show loading state
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'location-loading';
    loadingMessage.textContent = 'Getting your location...';
    if (map) {
      map.controls[window.google.maps.ControlPosition.TOP_CENTER].push(loadingMessage);
      // Remove the message after 3 seconds regardless of geolocation status
      setTimeout(() => loadingMessage.remove(), 3000);
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    // Update button state if it exists
    if (window.locationButton) {
      window.locationButton.classList.add('loading');
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Remove loading message
        loadingMessage.remove();

        const { latitude, longitude } = position.coords;
        const userLocation = new window.google.maps.LatLng(latitude, longitude);

        if (map && centerMap) {
          map.setCenter(userLocation);
          map.setZoom(15);
        }

        // Create or update user location marker
        if (window.userLocationMarker) {
          window.userLocationMarker.setPosition(userLocation);
        } else if (map) {
          window.userLocationMarker = new window.google.maps.Marker({
            position: userLocation,
            map: map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#0AC400',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            },
            title: 'Your Location'
          });
        }

        // Add accuracy circle
        if (window.accuracyCircle) {
          window.accuracyCircle.setMap(null);
        }
        if (map) {
          window.accuracyCircle = new window.google.maps.Circle({
            map: map,
            center: userLocation,
            radius: position.coords.accuracy,
            fillColor: '#0AC400',
            fillOpacity: 0.1,
            strokeColor: '#0AC400',
            strokeOpacity: 0.3,
            strokeWeight: 1
          });
        }

        // Remove loading state
        if (window.locationButton) {
          window.locationButton.classList.remove('loading');
        }
      },
      (error) => {
        // Remove loading message
        loadingMessage.remove();

        console.error('Geolocation error:', error);
        let errorMessage = 'Could not get your location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please enable location services in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += `Error: ${error.message}`;
        }

        setError(errorMessage);

        // Show error message on map
        if (map) {
          const errorDiv = document.createElement('div');
          errorDiv.className = 'location-error';
          errorDiv.textContent = errorMessage;
          map.controls[window.google.maps.ControlPosition.TOP_CENTER].push(errorDiv);
          
          // Remove error message after 5 seconds
          setTimeout(() => errorDiv.remove(), 5000);
        }

        // Remove loading state
        if (window.locationButton) {
          window.locationButton.classList.remove('loading');
        }
      },
      options
    );
  };

  // Update the createFetchDataButton function to add both buttons
  const createFetchDataButton = (map) => {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'custom-map-control';
    
    // Fetch Data button
    const fetchButton = document.createElement('button');
    fetchButton.className = 'fetch-data-button';
    fetchButton.innerHTML = 'Fetch Data';
    fetchButton.title = "Fetch WiGLE data for this area";
    
    // Save Data button
    const saveButton = document.createElement('button');
    saveButton.className = 'fetch-data-button';
    saveButton.innerHTML = 'Save Data';
    saveButton.title = "Save current data locally";
    saveButton.style.marginLeft = '10px';
    
    buttonContainer.appendChild(fetchButton);
    buttonContainer.appendChild(saveButton);
    
    // Position the buttons in the top-right corner
    map.controls[window.google.maps.ControlPosition.TOP_RIGHT].push(buttonContainer);
    
    fetchButton.addEventListener('click', () => fetchWigleData());
    saveButton.addEventListener('click', () => {
      if (window.heatmapLayer && window.heatmapLayer.getData()) {
        const bounds = map.getBounds();
        saveDataToLocalStorage(window.currentWigleData, bounds);
        showLoadingMessage('Data saved locally');
      } else {
        showLoadingMessage('No data to save');
      }
    });
    
    return buttonContainer;
  };

  // Update the useEffect hook that initializes the map
  useEffect(() => {
    let mounted = true;

    const initializeMap = () => {
      loadGoogleMapsWithRetry(() => {
        if (!mounted) return;

        try {
          if (!mapContainerRef.current) {
            console.error('Map container not found');
            return;
          }

          if (map) {
            console.log('Map already initialized');
            return;
          }

          console.log('Initializing map...');
          const mapInstance = new window.google.maps.Map(mapContainerRef.current, {
            center: { lat: 37.7749, lng: -122.4194 },
            zoom: 12,
            mapTypeId: 'roadmap',
            fullscreenControl: true,
            streetViewControl: false,
            mapTypeControl: true,
            zoomControl: true,
            styles: darkMapStyle,
            gestureHandling: 'greedy'
          });

          setMap(mapInstance);
          globalMapInstance = mapInstance;

          // Create location button after map is loaded
          createLocationButton(mapInstance);

          // Try to get initial location
          getUserLocation(mapInstance, true);

          // Add event listener for when map is fully loaded
          window.google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
            console.log('Map fully loaded and ready');
            setIsLoading(false);
            setLoadingMessage('');
            
            // Make sure visualization library is loaded before creating heatmap
            if (!window.google.maps.visualization) {
              console.error('Visualization library not loaded');
              return;
            }
            
            // Load saved data when map is ready
            const bounds = mapInstance.getBounds();
            if (bounds) {
              const cachedData = getDataFromLocalStorage(bounds);
              if (cachedData && cachedData.length > 0) {
                console.log('Found cached data:', cachedData.length, 'networks');
                window.currentWigleData = cachedData;
                
                try {
                  const heatmapData = cachedData.map(network => {
                    const lat = parseFloat(network.trilat || network.lat);
                    const lng = parseFloat(network.trilong || network.lng);
                    
                    if (isNaN(lat) || isNaN(lng)) {
                      console.warn('Invalid coordinates:', network);
                      return null;
                    }
                    
                    return {
                      location: new window.google.maps.LatLng(lat, lng),
                      weight: 3
                    };
                  }).filter(point => point !== null);

                  if (window.heatmapLayer) {
                    window.heatmapLayer.setMap(null);
                  }

                  if (heatmapData.length > 0) {
                    const currentZoom = mapInstance.getZoom();
                    window.heatmapLayer = new window.google.maps.visualization.HeatmapLayer({
                      data: heatmapData,
                      map: mapInstance,
                      radius: getHeatmapRadius(currentZoom),
                      opacity: 0.7,
                      maxIntensity: 8,
                      dissipating: true
                    });

                    // Add zoom change listener
                    window.google.maps.event.addListener(mapInstance, 'zoom_changed', () => {
                      const newZoom = mapInstance.getZoom();
                      if (window.heatmapLayer) {
                        window.heatmapLayer.setOptions({
                          radius: getHeatmapRadius(newZoom)
                        });
                      }
                    });
                    
                    console.log('Created heatmap with', heatmapData.length, 'points');
                    showLoadingMessage('Loaded saved data');
                    setTimeout(() => setLoadingMessage(''), 2000);
                  }
                } catch (error) {
                  console.error('Error creating heatmap:', error);
                }
              } else {
                console.log('No cached data found or data is empty');
              }
            }
          });

          // Add zoom level logging
          mapInstance.addListener('zoom_changed', () => {
            console.log('Current zoom level:', mapInstance.getZoom());
          });

          // Create fetch data button
          createFetchDataButton(mapInstance);

        } catch (error) {
          console.error('Error initializing map:', error);
          setLoadingMessage('Error initializing map. Please refresh the page.');
        }
      });
    };

    initializeMap();

    return () => {
      mounted = false;
      // Cleanup location tracking
      if (window.userLocationMarker) {
        window.userLocationMarker.setMap(null);
      }
      if (window.accuracyCircle) {
        window.accuracyCircle.setMap(null);
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
        
        // Use environment variable for API key
        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        
        // Call the Roads API to snap points to roads
        const response = await fetch(
          `https://roads.googleapis.com/v1/snapToRoads?path=${pathParam}&interpolate=true&key=${apiKey}`,
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
  
  // Update the fetchTileData function to better detect rate limits
  const fetchTileData = async (tile, credentials, retryCount = 0) => {
    const authToken = btoa(`${credentials.username}:${credentials.apiToken}`);
    let allResults = [];
    let searchAfter = 0;
    let keepGoing = true;
    let page = 0;

    try {
      while (keepGoing) {
        const params = new URLSearchParams({
          latrange1: tile.latrange1.toFixed(6),
          latrange2: tile.latrange2.toFixed(6),
          longrange1: tile.longrange1.toFixed(6),
          longrange2: tile.longrange2.toFixed(6),
          variance: '0.01',
          onlymine: '0',
          lastupdt: '20000101',
          resultsPerPage: '100',
          searchAfter: searchAfter
        });

        const url = `https://api.wigle.net/api/v2/network/search?${params}`;
        console.log(`Fetching tile: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${authToken}`,
            'Accept': 'application/json'
          }
        });

        // Log the raw response status to debug rate limit issues
        console.log(`API response status: ${response.status}, ${response.statusText}`);
        
        // Handle rate limiting - detect by status code
        if (response.status === 429) {
          console.error('Rate limit detected (429 status)');
          throw new Error('RATE_LIMIT');
        }

        if (!response.ok) {
          const text = await response.text();
          console.error(`API error: ${response.status}, body: ${text}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response:', data);

        // Also detect rate limit by message contents
        if (!data.success) {
          if (data.message && (
              data.message.includes('too many queries') || 
              data.message.includes('rate limit') ||
              data.message.includes('quota')
            )) {
            console.error(`Rate limit detected: ${data.message}`);
            throw new Error('RATE_LIMIT');
          }
          throw new Error(data.message || 'API request failed');
        }

        const validResults = (data.results || []).filter(network => {
          const lat = parseFloat(network.trilat);
          const lng = parseFloat(network.trilong);
          return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
        });

        console.log(`Tile returned ${validResults.length} valid networks`);
        allResults.push(...validResults);

        // Pagination: if we got less than 100, we're done; else, use searchAfter for next page
        if (validResults.length < 100 || !data.searchAfter) {
          keepGoing = false;
        } else {
          searchAfter = data.searchAfter;
          page++;
          // Optional: add a small delay to avoid hammering the API
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      return allResults;
    } catch (error) {
      if (error.message === 'RATE_LIMIT' || 
          error.message.includes('too many queries') || 
          error.message.includes('rate limit') ||
          error.message.includes('quota')) {
        console.error('Rate limit exception detected');
        throw new Error('RATE_LIMIT');
      }
      throw error;
    }
  };

  // Update the fetchDataByTiles function to better handle rate limiting
  const fetchDataByTiles = async (map, credentials) => {
    try {
      // Make an initial API call to check if we're already rate-limited
      setLoadingMessage('Checking API access...');
      const testTile = {
        latrange1: map.getCenter().lat() - 0.001,
        latrange2: map.getCenter().lat() + 0.001,
        longrange1: map.getCenter().lng() - 0.001,
        longrange2: map.getCenter().lng() + 0.001
      };
      
      try {
        await fetchTileData(testTile, credentials);
        // If we get here, we're not rate-limited
      } catch (error) {
        if (error.message === 'RATE_LIMIT') {
          console.error('Initial API check detected rate limit');
          setError('WiGLE API rate limit reached. Please try again later or use a different API key.');
          return [];
        }
        // Some other error - continue and try the actual fetching
        console.warn('Initial API check had an error, but continuing:', error);
      }
      
      // Continue with regular tile fetching
      const bounds = map.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      const TILE_SIZE = getAdaptiveTileSize(map);

      // Limit area to avoid too many API calls
      const latTiles = Math.ceil((ne.lat() - sw.lat()) / TILE_SIZE);
      const lngTiles = Math.ceil((ne.lng() - sw.lng()) / TILE_SIZE);
      const totalTiles = latTiles * lngTiles;
      
      console.log(`Area will be divided into ${totalTiles} tiles (${latTiles}x${lngTiles}), tile size: ${TILE_SIZE}`);
      
      if (totalTiles > 100) {
        setError('Selected area is too large and would require too many API calls. Please zoom in to fetch a smaller area.');
        return [];
      }

      const tiles = [];
      for (let lat = sw.lat(); lat < ne.lat(); lat += TILE_SIZE) {
        for (let lng = sw.lng(); lng < ne.lng(); lng += TILE_SIZE) {
          tiles.push({
            latrange1: lat,
            latrange2: Math.min(lat + TILE_SIZE, ne.lat()),
            longrange1: lng,
            longrange2: Math.min(lng + TILE_SIZE, ne.lng())
          });
        }
      }

      setLoadingMessage(`Fetching data from ${tiles.length} tiles (0% complete)...`);
      
      const allResults = [];
      let rateLimitHit = false;
      
      // Process one tile at a time
      for (let i = 0; i < tiles.length; i++) {
        try {
          const percentComplete = Math.round((i / tiles.length) * 100);
          setLoadingMessage(`Fetching data: ${percentComplete}% complete (tile ${i+1}/${tiles.length})`);
          
          // Add a delay between requests to avoid rate limiting
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 2500));
          }
          
          const results = await fetchTileData(tiles[i], credentials);
          if (results.length > 0) {
            allResults.push(...results);
            console.log(`Found ${results.length} networks in tile ${i+1}`);
          }
          
          setLoadingMessage(`Fetching data: ${percentComplete}% complete (found ${allResults.length} networks so far)`);
        } catch (error) {
          if (error.message === 'RATE_LIMIT') {
            rateLimitHit = true;
            setError('WiGLE API rate limit reached. You can still view and use the networks found so far.');
            break;
          }
          console.error(`Error processing tile ${i}:`, error);
        }
      }
      
      if (rateLimitHit) {
        console.log('Stopped fetching due to rate limit. Returning partial results:', allResults.length);
        if (allResults.length === 0) {
          // No results at all - likely rate limited immediately
          throw new Error('RATE_LIMIT');
        }
      }
      
      setLoadingMessage(`Found ${allResults.length} networks in visible area`);
      return allResults;
    } catch (error) {
      console.error('Error in fetchDataByTiles:', error);
      if (error.message === 'RATE_LIMIT') {
        throw new Error('RATE_LIMIT');
      }
      throw error;
    }
  };

  // Updated fetchWigleData function to handle rate limits better
  const fetchWigleData = async () => {
    if (!map && !globalMapInstance) {
      setError('Map not initialized');
      return;
    }

    const mapToUse = map || globalMapInstance;
    const credsToUse = credentials || globalCredentials;

    if (!credsToUse.username || !credsToUse.apiToken) {
      setError('Please enter your WiGLE API credentials');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMessage('Initializing WiGLE data fetch...');

    try {
      // Always fetch new data for the current map area using tiles
      const newResults = await fetchDataByTiles(mapToUse, credsToUse);
      console.log(`Fetched ${newResults.length} new networks from API`);

      // Get ALL existing saved data (not just for this area)
      const existingData = getDataFromLocalStorage() || [];
      console.log(`Found ${existingData.length} networks in local storage`);

      // Merge new and existing data, avoiding duplicates
      const combinedData = [...existingData];
      let newNetworksCount = 0;

      for (const network of newResults) {
        const isDuplicate = combinedData.some(existing => 
          existing.netid === network.netid || (
            Math.abs(existing.trilat - network.trilat) < 0.0000001 &&
            Math.abs(existing.trilong - network.trilong) < 0.0000001
          )
        );
        if (!isDuplicate) {
          combinedData.push(network);
          newNetworksCount++;
        }
      }

      // Clear existing heatmap
      if (window.heatmapLayer) {
        window.heatmapLayer.setMap(null);
      }

      // Create heatmap data
      const heatmapData = combinedData
        .filter(network => network.trilat && network.trilong)
        .map(network => ({
          location: new window.google.maps.LatLng(network.trilat, network.trilong),
          weight: 1
        }));

      console.log(`Creating heatmap with ${heatmapData.length} points`);

      if (heatmapData.length > 0) {
        // Create new heatmap
        const currentZoom = mapToUse.getZoom();
        window.heatmapLayer = new window.google.maps.visualization.HeatmapLayer({
          data: heatmapData,
          map: mapToUse,
          radius: getHeatmapRadius(currentZoom),
          opacity: 0.7,
          maxIntensity: 5
        });
      }

      // Save the merged data to local storage (so user can build up a city over time)
      window.currentWigleData = combinedData;
      saveDataToLocalStorage(combinedData, mapToUse.getBounds());

      // Update message
      let message = '';
      if (newNetworksCount > 0) {
        message = `Added ${newNetworksCount} new networks (Total saved: ${combinedData.length})`;
      } else if (newResults.length > 0 && newNetworksCount === 0) {
        message = `All ${newResults.length} networks already saved (Total saved: ${combinedData.length})`;
      } else if (combinedData.length > 0) {
        message = `No new networks found (Displaying ${combinedData.length} saved networks)`;
      } else {
        message = 'No networks found in this area';
      }
      
      setLoadingMessage(message);
      console.log(message);

    } catch (error) {
      console.error('Error in fetchWigleData:', error);
      if (error.message === 'RATE_LIMIT') {
        setError('WiGLE API rate limit has been reached. Please try again later or use a different API key.');
      } else {
        setError(`Error: ${error.message}`);
      }
      
      // Still try to display saved data if available
      const existingData = getDataFromLocalStorage() || [];
      if (existingData.length > 0) {
        if (window.heatmapLayer) {
          window.heatmapLayer.setMap(null);
        }
        
        const heatmapData = existingData
          .filter(network => network.trilat && network.trilong)
          .map(network => ({
            location: new window.google.maps.LatLng(
              parseFloat(network.trilat), 
              parseFloat(network.trilong)
            ),
            weight: 1
          }));
        
        if (heatmapData.length > 0) {
          const currentZoom = (map || globalMapInstance).getZoom();
          window.heatmapLayer = new window.google.maps.visualization.HeatmapLayer({
            data: heatmapData,
            map: map || globalMapInstance,
            radius: getHeatmapRadius(currentZoom),
            opacity: 0.7,
            maxIntensity: 5
          });
          
          setLoadingMessage(`API limit reached. Displaying ${existingData.length} previously saved networks.`);
        }
      }
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
  
  // Add this function to save data to local storage
  const saveDataToLocalStorage = (data, bounds) => {
    if (!data || !bounds) {
      console.error('Cannot save data: missing data or bounds');
      return;
    }

    const storageData = {
      timestamp: Date.now(),
      bounds: {
        ne: { lat: bounds.getNorthEast().lat(), lng: bounds.getNorthEast().lng() },
        sw: { lat: bounds.getSouthWest().lat(), lng: bounds.getSouthWest().lng() }
      },
      data: data
    };
    
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storageData));
      console.log(`Saved ${data.length} networks to local storage`);
    } catch (error) {
      console.error('Error saving to local storage:', error);
      
      // If we hit storage limits, try to save partial data
      try {
        // Remove less critical network properties to save space
        const compressedData = data.map(network => ({
          trilat: network.trilat,
          trilong: network.trilong,
          netid: network.netid,
          ssid: network.ssid
        }));
        
        const compressedStorageData = {
          timestamp: Date.now(),
          bounds: storageData.bounds,
          data: compressedData,
          compressed: true
        };
        
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(compressedStorageData));
        console.log(`Saved ${compressedData.length} networks in compressed format`);
      } catch (compressError) {
        console.error('Failed to save even compressed data:', compressError);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        console.log('Cleared local storage due to storage limits');
      }
    }
  };

  // Add this function to get data from local storage
  const getDataFromLocalStorage = () => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!storedData) {
        console.log('No data found in local storage');
        return [];
      }

      const parsedData = JSON.parse(storedData);
      
      // Check if the data is too old (older than MAX_STORAGE_AGE)
      if (parsedData.timestamp && (Date.now() - parsedData.timestamp > MAX_STORAGE_AGE)) {
        console.log('Stored data is too old, returning empty array');
        return [];
      }
      
      const data = parsedData.data || [];
      
      // Validate the data
      const validData = data.filter(network => {
        const lat = parseFloat(network.trilat);
        const lng = parseFloat(network.trilong);
        return !isNaN(lat) && !isNaN(lng);
      });

      console.log(`Found ${validData.length} valid networks in local storage out of ${data.length}`);
      return validData;
    } catch (error) {
      console.error('Error reading from local storage:', error);
      return [];
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
