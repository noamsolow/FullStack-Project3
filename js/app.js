// app.js


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

    Router.init();
});
