// register-page.js

function registerPageInit() {
    const form        = document.getElementById('register-form');
    const fullnameEl  = document.getElementById('reg-fullname');
    const emailEl     = document.getElementById('reg-email');
    const usernameEl  = document.getElementById('reg-username');
    const passwordEl  = document.getElementById('reg-password');
    const confirmEl   = document.getElementById('reg-confirm');

    const fullnameErr = document.getElementById('reg-fullname-err');
    const emailErr    = document.getElementById('reg-email-err');
    const usernameErr = document.getElementById('reg-username-err');
    const passwordErr = document.getElementById('reg-password-err');
    const confirmErr  = document.getElementById('reg-confirm-err');

    const banner      = document.getElementById('register-banner');
    const btn         = document.getElementById('register-btn');
    const btnText     = document.getElementById('register-btn-text');
    const spinner     = document.getElementById('register-spinner');

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

    function hideBanner() { banner.classList.add('hidden'); }

    function clearErrors() {
        [fullnameErr, emailErr, usernameErr, passwordErr, confirmErr]
            .forEach(el => { el.textContent = ''; });
        [fullnameEl, emailEl, usernameEl, passwordEl, confirmEl]
            .forEach(el => el.classList.remove('invalid'));
    }

    function setLoading(on) {
        btn.disabled = on;
        btnText.textContent = on ? 'Creating account…' : 'Create Account';
        spinner.classList.toggle('hidden', !on);
    }

    function validate() {
        clearErrors();
        let ok = true;

        if (!fullnameEl.value.trim()) {
            fullnameErr.textContent = 'Full name is required';
            fullnameEl.classList.add('invalid');
            ok = false;
        }

        const emailVal = emailEl.value.trim();
        if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
            emailErr.textContent = 'Enter a valid email address';
            emailEl.classList.add('invalid');
            ok = false;
        }

        if (!usernameEl.value.trim()) {
            usernameErr.textContent = 'Username is required';
            usernameEl.classList.add('invalid');
            ok = false;
        }

        if (passwordEl.value.length < 4) {
            passwordErr.textContent = 'Password must be at least 4 characters';
            passwordEl.classList.add('invalid');
            ok = false;
        }

        if (confirmEl.value !== passwordEl.value) {
            confirmErr.textContent = 'Passwords do not match';
            confirmEl.classList.add('invalid');
            ok = false;
        }

        return ok;
    }

    function doRegister() {
        if (!validate()) return;
        hideBanner();
        setLoading(true);

        const fxhr = new FXMLHttpRequest();
        fxhr.open('POST', '/users/register');

        fxhr.onload = function() {
            setLoading(false);
            const body = JSON.parse(fxhr.responseText);
            if (fxhr.status === 201) {
                showBanner('Account created! Logging you in…', 'success');
                autoLogin(usernameEl.value.trim(), hashPassword(passwordEl.value));
            } else {
                showBanner(body.message || 'Registration failed', 'error');
            }
        };

        fxhr.onerror = function() {
            setLoading(false);
            showBanner('Network error — please try again', 'error', doRegister);
        };

        fxhr.send({
            username:     usernameEl.value.trim(),
            passwordHash: hashPassword(passwordEl.value),
            fullName:     fullnameEl.value.trim(),
            email:        emailEl.value.trim()
        });
    }

    function autoLogin(username, passwordHash) {
        const loginFxhr = new FXMLHttpRequest();
        loginFxhr.open('POST', '/users/login');

        loginFxhr.onload = function() {
            const body = JSON.parse(loginFxhr.responseText);
            if (loginFxhr.status === 200) {
                window.AppSession = {
                    token:    body.token,
                    userId:   body.userId,
                    fullName: body.fullName
                };
                Router.navigate('contacts');
            } else {
                showBanner('Account created! Please log in.', 'success');
                Router.navigate('login');
            }
        };

        loginFxhr.onerror = function() {
            showBanner('Account created! Please log in.', 'success');
            Router.navigate('login');
        };

        loginFxhr.send({ username: username, passwordHash: passwordHash });
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        doRegister();
    });
}
