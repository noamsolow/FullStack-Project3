// app.js
// Application entry point — initializes globals and starts the router.
// Loaded last (all other scripts must be loaded before this).

document.addEventListener('DOMContentLoaded', function() {

    // Global session state — in-memory only, clears on refresh.
    // Shape when logged in: { token, userId, fullName }
    window.AppSession = null;

    // Register routes: hash name → page init function
    Router.routes = {
        'login':    loginPageInit,
        'register': registerPageInit,
        'contacts': contactsPageInit
    };

    // Start the router (reads current hash or defaults to #login)
    Router.init();
});
