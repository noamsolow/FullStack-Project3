// fajax.js
// FXMLHttpRequest — simulated XMLHttpRequest for client-server communication.
// Usage mirrors the real XMLHttpRequest API surface.

class FXMLHttpRequest {
    constructor() {
        this.readyState   = 0;
        this.status       = 0;
        this.responseText = '';
        this.onload       = null;
        this.onerror      = null;

        // Private internals
        this._method  = null;
        this._url     = null;
        this._headers = {};
        this._body    = null;
    }

    // Specify the request method and URL.
    open(method, url) {
        this._method    = method;
        this._url       = url;
        this.readyState = 1;
    }

    // Add a request header (e.g. Authorization).
    setRequestHeader(key, value) {
        this._headers[key] = value;
    }

    // Send the request through the Network simulation.
    // data: plain JS object — serialized to JSON to simulate data traveling over the wire.
    send(data) {
        this._body      = JSON.stringify(data !== null && data !== undefined ? data : null);
        this.readyState = 2;
        Network.send(this);
    }

    // ── Called only by Network

    // Fires when the server responded successfully (even 4xx counts as "load").
    _triggerLoad(response) {
        this.readyState   = 4;
        this.status       = response.status;
        this.responseText = JSON.stringify(response.body);
        if (typeof this.onload === 'function') {
            this.onload();
        }
    }

    // Fires when the message was dropped by the network.
    _triggerError(reason) {
        this.readyState   = 4;
        this.status       = 0;
        this.responseText = '';
        if (typeof this.onerror === 'function') {
            this.onerror({ message: reason });
        }
    }
}
