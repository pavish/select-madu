import GeneralUtils from './GeneralUtils.js';

class CancellablePromise {
  constructor(fn, onCancel) {
    this._rsvp = new Promise(fn);
    this._isActive = true;
    this._onCancel = onCancel;
  }

  getId() {
    if(!this._uuid) {
      this._uuid = GeneralUtils.getUUID();
    }
    return this._uuid;
  }

  cancel() {
    this._isActive = false;
    if(this._onCancel) {
      this._onCancel();
    }
    return this;
  }

  then(resolve, reject) {
    let self = this;
    this._rsvp.then(
      function(result) {
        if(self._isActive && resolve) {
          resolve(result);
        }
      },
      function(reason) {
        if(self._isActive && reject) {
          reject(reason);
        }
      }
    );
    return this;
  }

  finally(fn) {
    let self = this;
    this._rsvp.finally(function() {
      if(self._isActive) {
        fn();
      }
    });
    return this;
  }
}

export default CancellablePromise;