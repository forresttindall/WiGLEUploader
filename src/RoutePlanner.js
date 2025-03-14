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

// Add this function at the top of your component, before useEffect
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
    }, 500);
  };
  
  // Remove any existing script tags to avoid conflicts
  const existingScript = document.getElementById('google-maps-api');
  if (existingScript) {
    existingScript.remove();
  }
  
  // Create and append the script tag
  const script = document.createElement('script');
  script.id = 'google-maps-api';
  script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyC39qFGmCOo3FSV2AAYJMoR-OtspiPjkuU&libraries=visualization,places,drawing&callback=initGoogleMapsCallback`;
  script.async = true;
  script.defer = true;
  script.onerror = (error) => {
    console.error('Error loading Google Maps API:', error);
    if (retries > 0) {
      setTimeout(() => loadGoogleMapsWithRetry(callback, retries - 1), 1000);
    }
  };
  
  document.head.appendChild(script);
};

function RoutePlanner() {
  // State for WiGLE credentials
  const [credentials, setCredentials] = useState(() => {
    const savedCredentials = localStorage.getItem('wigleCredentials');
    return savedCredentials ? JSON.parse(savedCredentials) : {
      username: '',
      apiToken: ''
    };
  });
  
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
  
  const initMap = () => {
    if (!mapContainerRef.current || map) return;
    
    setIsLoading(true);
    setLoadingMessage('Initializing map...');
    
    try {
      // Create the map instance with dark mode styles always applied
      const mapInstance = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
        zoom: 13,
        mapTypeId: 'roadmap',
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: false,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU
        },
        styles: darkMapStyle // Always apply dark mode styles
      });
      
      // Set map in state
      setMap(mapInstance);
      
      // Add geolocation control
      const locationButton = document.createElement("button");
      locationButton.textContent = "My Location";
      locationButton.classList.add("custom-map-control-button");
      locationButton.style.backgroundColor = "#0CC400";
      locationButton.style.color = "white";
      locationButton.style.padding = "10px";
      locationButton.style.border = "none";
      locationButton.style.borderRadius = "4px";
      locationButton.style.margin = "10px";
      locationButton.style.cursor = "pointer";
      
      mapInstance.controls[window.google.maps.ControlPosition.TOP_RIGHT].push(locationButton);
      
      // Add click event for location button
      locationButton.addEventListener("click", () => {
        // Try HTML5 geolocation
        if (navigator.geolocation) {
          setLoadingMessage('Getting your location...');
          setIsLoading(true);
          
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              
              // Add a marker for user's location
              const userMarker = new window.google.maps.Marker({
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
              
              // Add a circle to show accuracy
              const accuracyCircle = new window.google.maps.Circle({
                map: mapInstance,
                center: pos,
                radius: position.coords.accuracy,
                strokeColor: "#0CC400",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#0CC400",
                fillOpacity: 0.2
              });
              
              mapInstance.setCenter(pos);
              setIsLoading(false);
            },
            (error) => {
              console.error("Error getting location:", error);
              setLoadingMessage(`Error getting location: ${error.message}`);
              setTimeout(() => setIsLoading(false), 2000);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        } else {
          setLoadingMessage("Geolocation is not supported by this browser.");
          setTimeout(() => setIsLoading(false), 2000);
        }
      });
      
      // Try to get user location automatically on load
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            
            // Add a marker for user's location
            const userMarker = new window.google.maps.Marker({
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
            
            mapInstance.setCenter(pos);
          },
          (error) => {
            console.error("Error getting initial location:", error);
            // Continue with default location if geolocation fails
          }
        );
      }
      
      // Add event listener for when map is fully loaded
      window.google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
        setIsLoading(false);
        console.log('Map fully loaded and ready');
      });
      
      // Add detailed console logs for zoom level changes (without emojis)
      mapInstance.addListener('zoom_changed', () => {
        const currentZoom = mapInstance.getZoom();
        console.log(`ZOOM CHANGED: Now at zoom level ${currentZoom}`);
        console.log(`Map bounds: ${JSON.stringify(mapInstance.getBounds().toJSON())}`);
        
        // Log different messages based on zoom level ranges
        if (currentZoom >= 18) {
          console.log(`Building level detail (zoom ${currentZoom})`);
        } else if (currentZoom >= 14) {
          console.log(`Street level detail (zoom ${currentZoom})`);
        } else if (currentZoom >= 10) {
          console.log(`Neighborhood level (zoom ${currentZoom})`);
        } else if (currentZoom >= 6) {
          console.log(`City/region level (zoom ${currentZoom})`);
        } else {
          console.log(`Country/continent level (zoom ${currentZoom})`);
        }
        
        if (window.heatmapLayer) {
          window.updateHeatmapSettings();
        }
      });
      
    } catch (error) {
      console.error('Error initializing map:', error);
      setLoadingMessage('Error initializing map. Please refresh the page.');
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
  
  // Fetch WiGLE data for the current map bounds
  const fetchWigleData = async () => {
    if (!map) {
      setError('Map not initialized');
      return;
    }
    
    if (!credentials.username || !credentials.apiToken) {
      setError('Please enter your WiGLE API credentials');
      return;
    }
    
    const bounds = map.getBounds();
    if (!bounds) {
      setError('Map bounds not available');
      return;
    }
    
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    // Get current zoom level
    const zoomLevel = map.getZoom();
    console.log(`Current zoom level: ${zoomLevel}`);
    
    // Calculate approximate area in square kilometers
    const latDiff = Math.abs(ne.lat() - sw.lat());
    const lngDiff = Math.abs(ne.lng() - sw.lng());
    const areaSqKm = latDiff * lngDiff * 111 * 111 * Math.cos(((ne.lat() + sw.lat()) / 2) * Math.PI / 180);
    
    console.log(`Approximate area: ${areaSqKm.toFixed(2)} sq km`);
    
    // Set limits based on zoom level
    if (zoomLevel < 12 && areaSqKm > 100) {
      setError('Please zoom in closer to fetch data. The current view is too large and may return too many results or timeout.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Fetching WiGLE data...');
    
    try {
      // Create the Basic Authentication token
      const authToken = btoa(`${credentials.username}:${credentials.apiToken}`);
      
      // Build the query with all necessary parameters
      // Remove any time-based filtering to get ALL data
      const queryParams = new URLSearchParams({
        onlymine: 'true',
        latrange1: sw.lat(),
        latrange2: ne.lat(),
        longrange1: sw.lng(),
        longrange2: ne.lng(),
        searchWifi: 'true',
        searchBluetooth: 'true',
        searchCell: 'true',
        resultsPerPage: 1000 // Request maximum results per page
      });
      
      // First request to get total count and first page
      const response = await fetch(`https://api.wigle.net/api/v2/network/search?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authToken}`
        }
      });
      
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
                'Authorization': `Basic ${authToken}`
              }
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
        map: map,
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
        if (!map || !window.heatmapLayer) return;
        
        const zoom = map.getZoom();
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
      map.addListener('zoom_changed', () => {
        window.updateHeatmapSettings();
      });
      
      // Add actual points for more accurate visualization
      allResults.forEach(network => {
        const marker = new window.google.maps.Marker({
          position: { lat: network.trilat, lng: network.trilong },
          map: map,
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
      
      map.controls[window.google.maps.ControlPosition.TOP_RIGHT].push(visualizationControl);
      
      document.getElementById('toggle-heatmap').addEventListener('click', () => {
        window.heatmapLayer.setMap(map);
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
      setError(error.message);
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
