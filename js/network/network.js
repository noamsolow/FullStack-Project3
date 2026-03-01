// network.js
// Network simulator — routes FAJAX requests to the correct server,
// with configurable random delay and message drop.

window.Network = {

    // Configuration (adjustable from browser console for testing)
    dropRate: 0.1,   // 0.0 = never drop, 0.5 = drop 50% of messages
    minDelay: 1000,  // minimum one-way delay in ms
    maxDelay: 3000,  // maximum one-way delay in ms

    // Called by FXMLHttpRequest.send().
    // Simulates: request trip → server processing → response trip.
    send: function(fxhr) {
        const delay1 = Network._randomDelay();

        // ── Request trip
        setTimeout(function() {

            // Maybe drop the request
            if (Network._shouldDrop()) {
                const delay2 = Network._randomDelay();
                setTimeout(function() {
                    fxhr._triggerError('Network error — message dropped');
                }, delay2);
                return;
            }

            // Route to the correct server
            const server = Network._route(fxhr._url);
            if (!server) {
                fxhr._triggerError('Network error — unknown destination');
                return;
            }

            // Build the request object — deserialize the JSON body on "arrival" at the server
            const request = {
                method:  fxhr._method,
                url:     fxhr._url,
                headers: fxhr._headers,
                body:    JSON.parse(fxhr._body)
            };
            const response = server.handle(request);

            // ── Response trip
            const delay2 = Network._randomDelay();
            setTimeout(function() {

                // Maybe drop the response
                if (Network._shouldDrop()) {
                    fxhr._triggerError('Network error — response dropped');
                    return;
                }

                fxhr._triggerLoad(response);

            }, delay2);

        }, delay1);
    },

    // ── Private helpers

    _randomDelay: function() {
        return Network.minDelay + Math.random() * (Network.maxDelay - Network.minDelay);
    },

    _shouldDrop: function() {
        return Math.random() < Network.dropRate;
    },

    // Route a URL to the correct server object.
    _route: function(url) {
        if (url.startsWith('/users/'))    return UsersServer;
        if (url.startsWith('/contacts'))  return DataServer;
        return null;
    }
};
