// router.js
// Hash-based SPA Router — loads HTML fragments and activates page controllers.

window.Router = {

    // Registered routes: hash → page init function name (set by app.js after all pages load)
    routes: {},

    // Start the router: handle the current hash and listen for changes.
    init: function() {
        window.addEventListener('hashchange', Router._navigate.bind(Router));
        Router._navigate();
    },

    // Navigate programmatically.
    navigate: function(hash) {
        window.location.hash = hash;
        
        // hashchange will fire and call _navigate automatically
    },

    // Internal: resolve and load the current hash.
    _navigate: function() {
        let hash = window.location.hash.replace('#', '').trim();

        // Default to login (and update URL to match)
        if (!hash || !Router.routes[hash]) {
            hash = 'login';
            window.location.hash = hash;
            return; // hashchange will re-trigger _navigate
        }

        // Auth guard: contacts page requires an active session
        if (hash === 'contacts' && !window.AppSession) {
            window.location.hash = 'login';
            return;
        }

        // Load the HTML fragment and activate the page
        Router._loadFragment(hash, function() {
            const initFn = Router.routes[hash];
            if (typeof initFn === 'function') {
                initFn();
            }
        });
    },

    // Load an HTML template from a <template id="tpl-{name}"> tag and inject it into #app.
    // No fetch() needed — works with file:// (Explorer double-click) and http:// (live server).
    _loadFragment: function(name, callback) {
        const tpl = document.getElementById('tpl-' + name);
        if (!tpl) {
            document.getElementById('app').innerHTML =
                '<p style="color:red;padding:2rem;">Template not found: tpl-' + name + '</p>';
            return;
        }
        const app = document.getElementById('app');
        app.innerHTML = '';
        app.appendChild(document.importNode(tpl.content, true));
        callback();
    }
};
