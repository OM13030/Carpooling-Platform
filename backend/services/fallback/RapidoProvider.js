const IRideProvider = require('./IRideProvider');

class RapidoProvider extends IRideProvider {
  get name() {
    return 'rapido';
  }

  get logoUrl() {
    return '/assets/rapido-logo.png';
  }

  get isEnabled() {
    // Disabled in Phase 1
    return false;
  }

  generateDeepLink(pickup, destination) {
    // Phase 3: Rapido universal/deep link formatting
    return `https://rapido.onelink.me/5a6b/route`;
  }
}

module.exports = new RapidoProvider();
