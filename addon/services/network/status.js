import Ember from 'ember';
import jQuery from 'jquery';

const {
  ajax
} = jQuery;

const {
  Evented,
  RSVP,
  Service,
  computed,
  run
} = Ember;

const {
  Promise
} = RSVP;

const INITIAL_PING_DEBOUNCE = 36;
const MAX_PING_DEBOUNCE = 1000 * 60 * 15;// 15min


export default Service.extend(Evented, {
  isOnline: true,
  isOffline: computed.not('isOnline'),

  // can be true even if we're actually online, kind of like airplane mode
  isOfflineMode: false,

  // failures represent both failures of pings and other
  // reported failures
  recentFailures: 0,

  // once this fail count is exceeded, `isOfflineMode` will be
  // entered automatically.  OfflineMode is not programmatically
  // disabled.
  maxFailuresBeforeOfflineMode: 10,

  pingDebounce: INITIAL_PING_DEBOUNCE,
  pingDebounceDecay: 1.1,
  networkPingUrl: 'http://google.com',
  _lastNetworkPing: null,
  _nextPingAttempt: null,

  // with 36ms start and 1.1 decay the first 100 requests take 90min
  // and at request 107 we hit our peak (15min between requests)
  // http://www.wolframalpha.com/input/?i=sum+%28.0006+*+1.1+%5E+n%29+from+1+to+100
  _decayPingDebounce() {
    let debounce = this.get('pingDebounce');
    let decay = this.get('pingDebounceDecay');
    this.set('pingDebounce', Math.min(debounce * decay, MAX_PING_DEBOUNCE));
  },

  _pingUrl(src) {
    return new Promise((resolve, reject) => {
      ajax({
        method: 'get',
        url: src,
        success: resolve,
        error: reject
      });
    });
  },

  setOnline() {
    run.cancel(this._nextPingAttempt);

    this.setProperties({
      isOnline: true,
      recentFailures: 0,
      pingDebounce: INITIAL_PING_DEBOUNCE
    });
  },

  setOffline() {
    this.set('isOnline', false);
  },

  _pingNetwork() {
    const src = this.get('networkPingUrl');

    if (this._lastNetworkPing && this._lastNetworkPing._state === 'pending') {
      return this._lastNetworkPing;
    }

    this._lastNetworkPing = this._pingUrl(src).then(() => {
      this.setOnline();
      this.trigger('networkAvailable');
    }).catch(() => {
      this.setOffline();
      this.incrementProperty('recentFailures');

      const recentFailures = this.get('recentFailures');
      const maxFailures = this.get('maxFailuresBeforeOfflineMode');

      // go into offline mode if we've failed too many times
      if (recentFailures >= maxFailures &&
        this.get('isOfflineMode') === false) {

        this.set('isOfflineMode', true);
        this.trigger('appOffline');
      }

      this.trigger('networkUnavailable');
      this._decayPingDebounce();
      this.pingNetwork();
    });

    return this._lastNetworkPing;
  },

  pingNetwork() {
    this._nextPingAttempt =
      run.debounce(this, this._pingNetwork, this.get('pingDebounce'));
  },

  networkRequestFailure() {
    this.incrementProperty('recentFailures');
    this.setOffline();
    this.pingNetwork();
  },

  networkRequestSuccess() {
    this.setOnline();
  },

  // isOfflineMode can only be turned off explicitly
  goOnline() {
    this.set('isOfflineMode', false);

    if (this.get('isOnline')) {
      this.trigger('appOnline');
    }
  }
});
