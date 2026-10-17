const userStore = require('./user-store');

class ConfigStore {
  get() {
    return userStore.getUserConfig('default');
  }

  save(newConfig) {
    return userStore.saveUserConfig('default', newConfig);
  }
}

module.exports = new ConfigStore();

