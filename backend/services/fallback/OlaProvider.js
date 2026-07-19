const IRideProvider = require('./IRideProvider');

class OlaProvider extends IRideProvider {
  get name() {
    return 'ola';
  }

  get logoUrl() {
    return '/assets/ola-logo.png';
  }

  get isEnabled() {
    // Disabled in Phase 1
    return false;
  }

  generateDeepLink(pickup, destination) {
    // Phase 3: Ola universal/deep link formatting
    return `https://olacabs.com/route`;
  }
}

module.exports = new OlaProvider();
