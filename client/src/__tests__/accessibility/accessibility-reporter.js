
class AccessibilityReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options;
  }

  onRunComplete(contexts, results) {
    // Implementation is in the main script
    // This file just needs to exist for Jest to load it
  }
}

module.exports = AccessibilityReporter;
