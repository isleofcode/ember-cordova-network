import Ember from 'ember';
import jQuery from 'jquery';

const {
  computed,
  run,
  warn,
  inject,
  Service
} = Ember;

export default Service.extend({

  cordova: inject.service('cordova'),

  _activities: 0,
  _indicator: null,
  _$notification: null,

  isVisible: computed.bool('_activities'),
  isHidden: computed.not('isVisible'),

  update() {
    if (this.get('isVisible')) {
      this._indicator.show();
    } else {
      this._indicator.hide();
    }
  },

  //useful for requests that don't resolve
  burst() {
    this.add();

    run.later(this, this.remove, 50);
  },

  add() {
    this.incrementProperty('_activities');
    this.update();
  },

  remove() {
    let count = this.get('_activities');

    count--;
    if (count < 0) {
      warn("WARNING you made a call to network/activity#remove without having first called network/activity#add");
      count = 0;
    }
    this.update();
  },


   /*
    Adds an indicator for when the cordova version is unavailable,
    up to end user to style.
   */
  _shimActivity() {
    const $notification = jQuery('<div class="cordova-loading-spinner-outer"><div class="cordova-loading-spinner-inner"></div></div>');
    jQuery('body').append($notification);

    this._indicator = {
      show() {
        if (!$notification.is(':visible')) {
          $notification.fadeIn(100);
        }
      },
      hide() {
        $notification.fadeOut(100);
      }
    };

    this._$notification = $notification;
  },

  _remove$notify() {
    if (this._$notification) {
      this._$notification.parentNode.removeChild(this._$notification);
      this._$notification = null;
    }
  },

  willDestroy() {
    this._super();
    this._remove$notify();
    this._indicator = null;
  },

  init() {
    this._super();

    this._shimActivity();

    this.get('cordova').ready()
      .then(() => {
        if (window.NetworkActivityIndicator) {
          this._remove$notify();
          this._indicator = window.NetworkActivityIndicator;
        }
        this.update();
      });
  }
});
