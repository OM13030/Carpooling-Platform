const IRideProvider = require('./IRideProvider');

class UberProvider extends IRideProvider {
  get name() {
    return 'uber';
  }

  get logoUrl() {
    // Return relative URL for official asset (or SVG)
    return '/assets/uber-logo.png';
  }

  get isEnabled() {
    // Enabled by default in Phase 1
    return true;
  }

  generateDeepLink(pickup, destination) {
    const pickupLat = pickup.coordinates[1];
    const pickupLng = pickup.coordinates[0];
    const pickupAddress = encodeURIComponent(pickup.address || 'Pickup Point');

    const destLat = destination.coordinates[1];
    const destLng = destination.coordinates[0];
    const destAddress = encodeURIComponent(destination.address || 'Dropoff Point');

    const clientId = process.env.UBER_CLIENT_ID || '';

    let url = `https://m.uber.com/?action=setPickup` +
              `&pickup[latitude]=${pickupLat}` +
              `&pickup[longitude]=${pickupLng}` +
              `&pickup[nickname]=${pickupAddress}` +
              `&pickup[formatted_address]=${pickupAddress}` +
              `&dropoff[latitude]=${destLat}` +
              `&dropoff[longitude]=${destLng}` +
              `&dropoff[nickname]=${destAddress}` +
              `&dropoff[formatted_address]=${destAddress}`;

    if (clientId) {
      url += `&client_id=${clientId}`;
    }

    return url;
  }

  // Phase 2 stub
  async getFareEstimate(pickup, destination) {
    // Phase 2: Call Uber Price Estimate API using OAuth client-credentials flow (UBER_CLIENT_SECRET)
    // Cache response in Redis briefly (60-120s)
    return null;
  }

  // Phase 3 stub
  async bookRide(pickup, destination, details) {
    // Phase 3: In-app booking via Uber Guest Trips API
    return null;
  }
}

module.exports = new UberProvider();
