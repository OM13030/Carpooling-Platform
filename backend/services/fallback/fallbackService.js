const uberProvider = require('./UberProvider');
const rapidoProvider = require('./RapidoProvider');
const olaProvider = require('./OlaProvider');

class FallbackService {
  constructor() {
    this.providers = [uberProvider, rapidoProvider, olaProvider];
  }

  getEnabledProviders() {
    return this.providers.filter(p => p.isEnabled);
  }

  getAvailableFallbacks(pickup, destination) {
    const enabled = this.getEnabledProviders();
    return enabled.map(p => ({
      provider: p.name,
      logoUrl: p.logoUrl,
      deepLink: p.generateDeepLink(pickup, destination)
    }));
  }
}

module.exports = new FallbackService();
