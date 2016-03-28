/*jshint node:true*/
'use strict';
var awaitCommand = require('../../lib/await-command');
var Promise  = require('rsvp').Promise;

module.exports = function commandChain(commands) {
  return commands.reduce(function(chain, command) {
    return chain.then(function() {
      return awaitCommand(command);
    });
  }, Promise.resolve());
};
