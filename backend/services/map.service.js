const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

class MemoryCache {
  constructor(ttlMs = 600000) { // 10 mins
    this.cache = new Map();
    this.ttl = ttlMs;
  }
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }
  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl,
    });
  }
}

const routeCache = new MemoryCache(600000);

class MapService {
  constructor() {
    this.apiKey = process.env.GRAPHHOPPER_API_KEY;
  }

  isMockMode() {
    return !this.apiKey;
  }

  async geocode(query) {
    if (this.isMockMode()) {
      logger.info(`GraphHopper API key missing. Mocking geocode for query: ${query}`);
      const mockPlaces = [
        { name: 'Odoo India Headquarters', address: 'KSV Corporate Tower, Info City, Gandhinagar', lat: 23.2156, lng: 72.6369 },
        { name: 'KSV University Campus', address: 'Sector-15, Gandhinagar, Gujarat', lat: 23.2324, lng: 72.6465 },
        { name: 'GIFT City Tower A', address: 'GIFT City Road, Gandhinagar', lat: 23.1601, lng: 72.6841 },
        { name: 'Gandhinagar Railway Station', address: 'Sector-14, Gandhinagar', lat: 23.2285, lng: 72.6321 },
        { name: 'Infocity IT Park Gate 1', address: 'Infocity Road, Gandhinagar', lat: 23.2089, lng: 72.6278 },
        { name: 'Adalaj Stepwell Park', address: 'Adalaj, Gandhinagar District', lat: 23.1670, lng: 72.5801 },
        { name: 'Akshardham Temple Ground', address: 'Sector-20, Gandhinagar', lat: 23.2291, lng: 72.6744 }
      ];
      return mockPlaces.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.address.toLowerCase().includes(query.toLowerCase())
      );
    }

    try {
      const url = `https://graphhopper.com/api/1/geocode?q=${encodeURIComponent(query)}&key=${this.apiKey}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`GraphHopper Geocode error: ${response.statusText}`);
      const data = await response.json();
      return (data.hits || []).map(hit => ({
        name: hit.name,
        address: hit.street ? `${hit.name}, ${hit.street}, ${hit.city || ''}` : hit.name,
        lat: hit.point.lat,
        lng: hit.point.lng
      }));
    } catch (error) {
      logger.error('Geocoding failed, falling back to mock: ' + error.message);
      return [];
    }
  }

  async reverseGeocode(lat, lng) {
    if (this.isMockMode()) {
      return {
        address: `KSV Corporate Tower, Gandhinagar (Mocked from ${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)})`,
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };
    }

    try {
      const url = `https://graphhopper.com/api/1/geocode?reverse=true&point=${lat},${lng}&key=${this.apiKey}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`GraphHopper Reverse Geocode error: ${response.statusText}`);
      const data = await response.json();
      const hit = data.hits && data.hits[0];
      if (!hit) {
        return { address: `Unknown location at ${lat}, ${lng}`, lat, lng };
      }
      return {
        address: hit.street ? `${hit.name}, ${hit.street}, ${hit.city || ''}` : hit.name,
        lat: hit.point.lat,
        lng: hit.point.lng
      };
    } catch (error) {
      logger.error('Reverse Geocoding failed, falling back: ' + error.message);
      return { address: `GPS Location (${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)})`, lat, lng };
    }
  }

  async getRoute(fromLat, fromLng, toLat, toLng) {
    const lat1 = parseFloat(fromLat).toFixed(4);
    const lng1 = parseFloat(fromLng).toFixed(4);
    const lat2 = parseFloat(toLat).toFixed(4);
    const lng2 = parseFloat(toLng).toFixed(4);

    const cacheKey = `${lat1},${lng1}->${lat2},${lng2}`;
    const cached = routeCache.get(cacheKey);
    if (cached) {
      logger.info(`Route cache HIT for key: ${cacheKey}`);
      return cached;
    }

    if (this.isMockMode()) {
      // Simulate route distance (using simple spherical delta)
      const dLat = parseFloat(toLat) - parseFloat(fromLat);
      const dLng = parseFloat(toLng) - parseFloat(fromLng);
      // Approximately 111km per degree
      const distanceMeters = Math.round(Math.sqrt(dLat*dLat + dLng*dLng) * 111320);
      const durationSeconds = Math.round((distanceMeters / 12) + 120); // 12 m/s average speed (~45km/h) + overhead
      
      // Interpolate points for a slightly winding path (5 points)
      const points = [];
      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        const ratio = i / steps;
        const lat = parseFloat(fromLat) + dLat * ratio + (i > 0 && i < steps ? (Math.sin(i) * 0.001) : 0);
        const lng = parseFloat(fromLng) + dLng * ratio + (i > 0 && i < steps ? (Math.cos(i) * 0.001) : 0);
        points.push([lat, lng]); // Leaflet uses [lat, lng] format
      }

      const result = {
        distance: distanceMeters,
        time: durationSeconds * 1000,
        points: points // list of [lat, lng] pairs
      };

      routeCache.set(cacheKey, result);
      return result;
    }

    try {
      const url = `https://graphhopper.com/api/1/route?point=${fromLat},${fromLng}&point=${toLat},${toLng}&profile=car&points_encoded=false&key=${this.apiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`GraphHopper Route error status ${response.status}: ${errText}`);
      }
      const data = await response.json();
      const path = data.paths && data.paths[0];
      if (!path) throw new Error('No path returned from GraphHopper');

      // Convert coordinates from [lng, lat] to Leaflet standard [lat, lng]
      const points = path.points.coordinates.map(coord => [coord[1], coord[0]]);

      const result = {
        distance: path.distance, // in meters
        time: path.time, // in ms
        points: points
      };

      routeCache.set(cacheKey, result);
      return result;
    } catch (error) {
      logger.error('Routing failed: ' + error.message);
      throw new ApiError(502, `Failed to retrieve route: ${error.message}`);
    }
  }
}

module.exports = new MapService();
