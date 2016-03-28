import Ember from 'ember';
import { task, drop } from 'ember-concurrency';
import fetch from 'ember-network/fetch';

const {
  Evented,
  Service,
  computed
} = Ember;

const INITIAL_PING_DEBOUNCE = 36;
const INITIAL_HEALTH_DEBOUNCE = 60000; // 1min
const INITIAL_PING_DECAY = 1.1;
const MAX_PING_DEBOUNCE = 1000 * 60 * 15; // 15min

function watchType(options) {
  return task(drop, function * () {
    while (true) {
      if (this.get('monitor') && this.get('isConnected') && !this.get(options.bool)) {
        yield fetch(this.get(options.url))
          .then(() => {
            this.set(options.bool, true);
            this.set(options.failures, 0);
          })
          .catch(() => {
            this.set(options.bool, false);
            this.incrementProperty(options.failures);
          });
      }

      if (!this.get(options.bool)) {
        yield timeout(this._decay(this.get(options.failures)));
      } else {
        yield timeout(this.get('healthCheckDebounce'));
      }
    }
  }).on('init');
}

export default Service.extend(Evented, {

  // ------- user configurable settings
  pingDebounce: INITIAL_PING_DEBOUNCE,
  maxPingDebounce: MAX_PING_DEBOUNCE,
  pingDebounceDecay: INITIAL_PING_DECAY,
  healthCheckDebounce: INITIAL_HEALTH_DEBOUNCE,

  // the service url is something on your site
  // pinging this should let you know whether your own
  // site is currently functioning correctly
  serviceUrl: null,

  // the network url is a trusted url someplace else
  // it often needs to be http
  // http://google.com is a decent choice
  networkUrl: null,

  // -------- status checks
  // whether the network is online or offline
  networkIsOnline: true,
  networkIsOffline: computed.not('networkIsOnline'),

  // whether the service is online or offline
  serviceIsOnline: true,
  serviceIsOffline: computed.not('serviceIsOnline'),

  // whether we've forces a disconnect or not
  // kind of like airplane mode
  isDisconnected: false,
  isConnected: computed.not('isDisconnected'),

  // -------- whether we should be monitoring
  monitor: false,

  disconnect() {
    this.set('isDisconnected', true);
  },

  connect() {
    this.set('isDisconnected', false);
  },

  _networkFailures: 0,
  watchNetwork: watchType({
    bool: 'networkIsOnline',
    url: 'networkUrl',
    failures: '_networkFailures'
  }),

  _serviceFailures: 0,
  watchService: watchType({
    bool: 'serviceIsOnline',
    url: 'serviceUrl',
    failures: '_serviceFailures'
  }),

  networkPingUrl: 'http://google.com',
  _lastNetworkPing: null,
  _nextPingAttempt: null,

  // with 36ms start and 1.1 decay the first 100 requests take 90min
  // and at request 107 we hit our peak (15min between requests)
  // http://www.wolframalpha.com/input/?i=sum+%28.0006+*+1.1+%5E+n%29+from+1+to+100
  _decay(count) {
    let debounce = this.get('pingDebounce');
    let decay = this.get('pingDebounceDecay');
    let max = this.get('maxPingDebounce');
    let currentDebounce = debounce * Math.pow(decay, count);

    return Math.min(currentDebounce, max);
  }

});
