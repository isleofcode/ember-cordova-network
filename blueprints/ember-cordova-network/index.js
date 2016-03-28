/*jshint node:true*/
var VersionChecker = require('ember-cli-version-checker');
var commandChain = require('../../lib/command-chain');

module.exports = {
  description: 'Installs the cordova plugins required for network functionality',

  normalizeEntityName: function() {},

  afterInstall: function() {
    var checker = new VersionChecker(this);
    var dep = checker.for('ember-platform-cordova', 'npm');
    if (!dep.version) {
      throw new Error("ember-cordova-keyboard requires ember-platform-cordova.");
    }

    var plugins = [
      'ember cordova plugin add cordova-plugin-network-information --save',
      'ember cordova plugin add cordova-plugin-networkactivityindicator --save'
    ];

    return commandChain(plugins);
  }
};
