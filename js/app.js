// app.js

document.addEventListener('DOMContentLoaded', function() {

    window.AppSession = null;

    Router.routes = {
        'login':    loginPageInit,
        'register': registerPageInit,
        'contacts': contactsPageInit
    };

    Router.init();
});
