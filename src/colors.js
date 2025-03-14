 // Create heatmap layer with adjusted settings for better linear appearance
 window.heatmapLayer = new window.google.maps.visualization.HeatmapLayer({
    data: heatmapData,
    map: map,
    radius: 15, // Increased radius to connect points better
    opacity: 0.7, // Reduced opacity for better map visibility
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