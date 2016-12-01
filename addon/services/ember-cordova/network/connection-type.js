import Ember from 'ember';

const {
  Evented,
  Service,
  run
} = Ember;

const CHANGE_EVENT_NAME = 'networkConnectionChange';

export default Service.extend(Evented, {

  getTypeIdentifier(type) {
    let { Connection } = window;
    let states = {};

    if (!Connection) {
      return 'Unknown';
    }

    states[Connection.UNKNOWN]  = 'Unknown';
    states[Connection.ETHERNET] = 'Ethernet';
    states[Connection.WIFI]     = 'WiFi';
    states[Connection.CELL_2G]  = 'Cellular 2G';
    states[Connection.CELL_3G]  = 'Cellular 3G';
    states[Connection.CELL_4G]  = 'Cellular 4G';
    states[Connection.CELL]     = 'Cellular';
    states[Connection.NONE]     = 'None';

    return states[type];
  },

  connectionType: 'default',
  pollFrequency: 10000, // 10s

  _nextUpdate: null,
  updateConnectionType() {
    if (window.navigator && window.navigator.connection) {
      let previous = this.get('connectionType');
      let current = window.navigator.connection.type;

      if (current !== previous) {
        this.set('connectionType', current);

        if (previous !== 'default') {
          let change = {
            connectionType: current,
            connectionIdentifier: this.getTypeIdentifier(current),
            previous,
            previousIdentifier: this.getTypeIdentifier(previous),
            time: Date.now()
          };

          this.trigger(CHANGE_EVENT_NAME, change);
        }
      }

      this._nextUpdate =  run.later(this, this.updateConnectionType, this.get('pollFrequency'));

    }
  },

  willDestroy() {
    this._super();
    run.cancel(this._nextUpdate);
  },

  init() {
    this._super();

    this.get('cordova').ready()
      .then(() => {
        this.updateConnectionType();
      });
  }

});
