class IRideProvider {
  constructor() {
    if (new.target === IRideProvider) {
      throw new TypeError("Cannot construct IRideProvider instances directly");
    }
  }

  get name() {
    throw new Error("Property 'name' must be implemented");
  }

  get logoUrl() {
    throw new Error("Property 'logoUrl' must be implemented");
  }

  get isEnabled() {
    throw new Error("Property 'isEnabled' must be implemented");
  }

  generateDeepLink(pickup, destination) {
    throw new Error("Method 'generateDeepLink' must be implemented");
  }

  // Phase 2 stub
  async getFareEstimate(pickup, destination) {
    // Phase 2: Call provider API using client credentials flow
    return null;
  }

  // Phase 3 stub
  async bookRide(pickup, destination, details) {
    // Phase 3: Book ride via provider API
    return null;
  }
}

module.exports = IRideProvider;
