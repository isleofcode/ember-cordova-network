/*jshint node:true*/
var VersionChecker = require('ember-cli-version-checker');
var commandChain = require('../../lib/command-chain');

module.exports = {
  description: 'Installs the cordova plugins required for network functionality',

  normalizeEntityName: function() {},

  afterInstall: function() {
    var checker = new VersionChecker(this);
    var dep = checker.for('ember-platform-cordova', 'npm');

    var plugins = [
      'ember cdv:plugin add cordova-plugin-network-information',
      'ember cdv:plugin add cordova-plugin-networkactivityindicator'
    ];

    return commandChain(plugins);
  }
};
