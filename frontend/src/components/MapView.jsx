import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useThemeStore } from '../App';

export const MapView = ({ 
  pickup,       // { coordinates: [lng, lat], address }
  destination,  // { coordinates: [lng, lat], address }
  vehicleLoc,   // [lat, lng]
  routePoints,  // array of [lat, lng]
  height = '400px'
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  
  const theme = useThemeStore(state => state.theme);
  
  // Keep track of vehicle location for smooth sliding interpolation
  const lastVehicleLocRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([23.2156, 72.6369], 13); // Default Gandhinagar center

    mapRef.current = map;

    // Load CARTO tiles based on theme
    const tileUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const tiles = L.tileLayer(tileUrl, {
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = tiles;

    // Setup custom marker icons
    const createPinHtml = (color) => `
      <div class="relative flex items-center justify-center w-8 h-8">
        <span class="absolute inline-flex h-6 w-6 rounded-full bg-${color} opacity-40 animate-ping"></span>
        <div class="w-4 h-4 rounded-full border-2 border-white shadow-lg bg-${color}"></div>
      </div>
    `;

    const pickupIcon = L.divIcon({
      className: 'custom-pickup-pin',
      html: createPinHtml('primary'), // Primary accent
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const destIcon = L.divIcon({
      className: 'custom-dest-pin',
      html: createPinHtml('secondary'), // Secondary accent
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Save marker definitions
    pickupMarkerRef.current = L.marker([0, 0], { icon: pickupIcon });
    destMarkerRef.current = L.marker([0, 0], { icon: destIcon });

    // Vehicle icon SVG
    const carSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 text-primary drop-shadow-md">
        <path d="M20.5 11h-.66l-1.39-4.17A2 2 0 0 0 16.56 5.5H7.44a2 2 0 0 0-1.89 1.33L4.16 11H3.5a1.5 1.5 0 0 0 0 3h.5v4.5A1.5 1.5 0 0 0 5.5 20h1a1.5 1.5 0 0 0 1.5-1.5V18h12v.5a1.5 1.5 0 0 0 1.5 1.5h1a1.5 1.5 0 0 0 1.5-1.5V14h.5a1.5 1.5 0 0 0 0-3zM7.5 7.5h9l1.16 3.5H6.34zM6.5 15A1.5 1.5 0 1 1 8 13.5 1.5 1.5 0 0 1 6.5 15zm11 0a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5z"/>
      </svg>
    `;

    const vehicleIcon = L.divIcon({
      className: 'custom-vehicle-marker',
      html: `<div class="vehicle-rotate-wrapper transition-transform duration-100">${carSvg}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    vehicleMarkerRef.current = L.marker([0, 0], { icon: vehicleIcon });
    routePolylineRef.current = L.polyline([], {
      color: theme === 'dark' ? '#e78a53' : '#d87943', // matching primary theme accent
      weight: 4,
      opacity: 0.8,
      lineJoin: 'round'
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      map.remove();
    };
  }, []);

  // Update Tile Layer and Route Color when theme changes
  useEffect(() => {
    if (tileLayerRef.current) {
      const tileUrl = theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      tileLayerRef.current.setUrl(tileUrl);
    }
    if (routePolylineRef.current) {
      routePolylineRef.current.setStyle({
        color: theme === 'dark' ? '#e78a53' : '#d87943'
      });
    }
  }, [theme]);

  // Update pickup and destination pins
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const bounds = [];

    if (pickup && pickup.coordinates) {
      const latLng = [pickup.coordinates[1], pickup.coordinates[0]];
      pickupMarkerRef.current.setLatLng(latLng).addTo(map);
      bounds.push(latLng);
    } else {
      pickupMarkerRef.current.remove();
    }

    if (destination && destination.coordinates) {
      const latLng = [destination.coordinates[1], destination.coordinates[0]];
      destMarkerRef.current.setLatLng(latLng).addTo(map);
      bounds.push(latLng);
    } else {
      destMarkerRef.current.remove();
    }

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [pickup, destination]);

  // Update Polyline Route
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !routePolylineRef.current) return;

    if (routePoints && routePoints.length > 0) {
      routePolylineRef.current.setLatLngs(routePoints).addTo(map);
      map.fitBounds(routePolylineRef.current.getBounds(), { padding: [40, 40] });
    } else {
      routePolylineRef.current.remove();
    }
  }, [routePoints]);

  // Interpolate vehicle position smoothly
  useEffect(() => {
    const map = mapRef.current;
    const marker = vehicleMarkerRef.current;
    if (!map || !marker || !vehicleLoc) return;

    const startLoc = lastVehicleLocRef.current || vehicleLoc;
    const endLoc = vehicleLoc;
    
    if (!lastVehicleLocRef.current) {
      // First ping: set immediately
      marker.setLatLng(endLoc).addTo(map);
      lastVehicleLocRef.current = endLoc;
      return;
    }

    if (startLoc[0] === endLoc[0] && startLoc[1] === endLoc[1]) {
      return;
    }

    // Cancel prior tweens
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const duration = 2000; // interpolate over 2s
    const startTime = performance.now();

    // Calculate heading angle
    const angle = Math.atan2(endLoc[0] - startLoc[0], endLoc[1] - startLoc[1]) * 180 / Math.PI;
    const rotation = 90 - angle; // offset standard SVG heading top

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Linear interpolation
      const lat = startLoc[0] + (endLoc[0] - startLoc[0]) * progress;
      const lng = startLoc[1] + (endLoc[1] - startLoc[1]) * progress;

      marker.setLatLng([lat, lng]);

      // Set rotation inline
      const el = marker.getElement();
      if (el) {
        const wrapper = el.querySelector('.vehicle-rotate-wrapper');
        if (wrapper) {
          wrapper.style.transform = `rotate(${rotation}deg)`;
        }
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        lastVehicleLocRef.current = endLoc;
      }
    };

    marker.addTo(map);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [vehicleLoc]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full bg-card border border-border rounded-xl shadow-lg relative overflow-hidden"
      style={{ height }}
    />
  );
};

export default MapView;
