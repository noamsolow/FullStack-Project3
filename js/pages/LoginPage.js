// login-page.js
// Login screen controller — called by the router after injecting login.html.


// ── Password hashing
// djb2 hash — pure JS, no libraries. Exposed globally so login-page.js
// can hash the password before sending it over the "network".
window.hashPassword = function(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & hash; // force 32-bit integer
    }
    
    return String(hash >>> 0); // unsigned 32-bit, always positive string
};
function loginPageInit() {
    // ── DOM refs
    const form        = document.getElementById('login-form');
    const usernameEl  = document.getElementById('login-username');
    const passwordEl  = document.getElementById('login-password');
    const usernameErr = document.getElementById('login-username-err');
    const passwordErr = document.getElementById('login-password-err');
    const banner      = document.getElementById('login-banner');
    const btn         = document.getElementById('login-btn');
    const btnText     = document.getElementById('login-btn-text');
    const spinner     = document.getElementById('login-spinner');

    // ── Helpers
    function showBanner(msg, type, retryFn) {
        banner.textContent = '';
        banner.className   = 'banner ' + type;
        banner.textContent = msg;
        if (retryFn) {
            const retryBtn = document.createElement('button');
            retryBtn.className   = 'retry-btn';
            retryBtn.textContent = 'Retry';
            retryBtn.addEventListener('click', retryFn);
            banner.appendChild(retryBtn);
        }
        banner.classList.remove('hidden');
    }

    function hideBanner()    { banner.classList.add('hidden'); }
    function clearErrors()   {
        usernameErr.textContent = '';
        passwordErr.textContent = '';
        usernameEl.classList.remove('invalid');
        passwordEl.classList.remove('invalid');
    }

    function setLoading(on) {
        btn.disabled = on;
        btnText.textContent = on ? 'Signing in…' : 'Sign In';
        spinner.classList.toggle('hidden', !on);
    }

    // ── Validation
    function validate() {
        clearErrors();
        let ok = true;
        if (!usernameEl.value.trim()) {
            usernameErr.textContent = 'Username is required';
            usernameEl.classList.add('invalid');
            ok = false;
        }
        if (!passwordEl.value) {
            passwordErr.textContent = 'Password is required';
            passwordEl.classList.add('invalid');
            ok = false;
        }
        return ok;
    }

    // ── FAJAX request
    function doLogin() {
        if (!validate()) return;
        hideBanner();
        setLoading(true);

        const username = usernameEl.value.trim();
        const password = passwordEl.value;

        const fxhr = new FXMLHttpRequest();
        fxhr.open('POST', '/users/login');

        fxhr.onload = function() {
            setLoading(false);
            const body = JSON.parse(fxhr.responseText);
            if (fxhr.status === 200) {
                window.AppSession = {
                    token:    body.token,
                    userId:   body.userId,
                    fullName: body.fullName
                };
                Router.navigate('contacts');
            } else {
                showBanner(body.message || 'Login failed', 'error');
            }
        };

        fxhr.onerror = function() {
            setLoading(false);
            showBanner('Network error — please try again', 'error', doLogin);
        };

        // Hash password on client before sending (same approach as register)
        fxhr.send({ username: username, passwordHash: hashPassword(password) });
    }

    // ── Event binding
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        doLogin();
    });
}
