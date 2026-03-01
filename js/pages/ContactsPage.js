// contacts-page.js
// Contacts screen controller — called by the router after injecting contacts.html.

function contactsPageInit() {

    // ── Auth guard
    if (!window.AppSession) {
        Router.navigate('login');
        return;
    }

    // ── In-memory state
    let _allContacts  = [];   // full list from server
    let _requestId    = 0;    // race-condition guard counter

    // ── DOM refs
    const greetingEl     = document.getElementById('user-greeting');
    const logoutBtn      = document.getElementById('logout-btn');
    const searchInput    = document.getElementById('search-input');
    const addBtn         = document.getElementById('add-btn');
    const tbody          = document.getElementById('contacts-tbody');
    const emptyState     = document.getElementById('empty-state');
    const loadingOverlay = document.getElementById('loading-overlay');
    const banner         = document.getElementById('contacts-banner');

    // Modal
    const modalOverlay  = document.getElementById('modal-overlay');
    const modalTitle    = document.getElementById('modal-title');
    const modalClose    = document.getElementById('modal-close');
    const modalCancel   = document.getElementById('modal-cancel-btn');
    const contactForm   = document.getElementById('contact-form');
    const contactIdEl   = document.getElementById('contact-id');
    const firstNameEl   = document.getElementById('contact-firstname');
    const lastNameEl    = document.getElementById('contact-lastname');
    const phoneEl       = document.getElementById('contact-phone');
    const emailEl       = document.getElementById('contact-email');
    const addressEl     = document.getElementById('contact-address');
    const firstNameErr  = document.getElementById('contact-firstname-err');
    const modalBanner   = document.getElementById('modal-banner');
    const modalSaveBtn  = document.getElementById('modal-save-btn');
    const modalBtnText  = document.getElementById('modal-btn-text');
    const modalSpinner  = document.getElementById('modal-spinner');

    // ── Avatar helpers
    // Generate a stable, hue-shifted color from any string
    function _avatarColor(str) {
        let h = 0;
        const s = String(str || '');
        for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
        return 'hsl(' + (Math.abs(h) % 360) + ', 55%, 46%)';
    }

    // Get up to 2 initials from first + last name
    function _initials(first, last) {
        const a = (first || '').trim()[0] || '';
        const b = (last  || '').trim()[0] || '';
        return (a + b).toUpperCase() || '?';
    }

    // ── Init UI
    // Populate the user badge in the header with initials + name
    const _userParts = (AppSession.fullName || '').trim().split(/\s+/).filter(Boolean);
    const _userInit  = _userParts.map(function(w) { return w[0]; }).slice(0, 2).join('').toUpperCase() || '?';
    greetingEl.innerHTML =
        '<div class="user-badge-avatar" style="background:' + _avatarColor(AppSession.fullName) + '">' +
            _userInit +
        '</div>' +
        '<span>' + _esc(AppSession.fullName) + '</span>';

    // ── Banner helpers
    function showBanner(msg, type, retryFn) {
        banner.textContent = '';
        banner.className   = 'banner ' + type;
        banner.textContent = msg;
        if (retryFn) {
            const btn = document.createElement('button');
            btn.className   = 'retry-btn';
            btn.textContent = 'Retry';
            btn.addEventListener('click', retryFn);
            banner.appendChild(btn);
        }
        banner.classList.remove('hidden');
    }
    function hideBanner() { banner.classList.add('hidden'); }

    function showModalBanner(msg, type) {
        modalBanner.textContent = msg;
        modalBanner.className   = 'banner ' + type;
        modalBanner.classList.remove('hidden');
    }
    function hideModalBanner() { modalBanner.classList.add('hidden'); }

    // ── Loading state
    function setLoading(on) {
        loadingOverlay.classList.toggle('hidden', !on);
        addBtn.disabled = on;
    }

    function setModalLoading(on) {
        modalSaveBtn.disabled    = on;
        modalBtnText.textContent = on ? 'Saving…' : 'Save Contact';
        modalSpinner.classList.toggle('hidden', !on);
    }

    // ── FAJAX helper
    function buildFxhr() {
        const fxhr = new FXMLHttpRequest();
        fxhr.setRequestHeader('Authorization', 'Bearer ' + AppSession.token);
        return fxhr;
    }

    // ── Escape HTML to prevent XSS
    function _esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── SVG icons for action buttons
    const ICON_EDIT =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>' +
        '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>' +
        '</svg>';

    const ICON_DELETE =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<polyline points="3 6 5 6 21 6"/>' +
        '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>' +
        '<path d="M10 11v6M14 11v6"/>' +
        '<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>' +
        '</svg>';

    // ── Render
    function renderContacts(contacts) {
        tbody.innerHTML = '';

        if (contacts.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }
        emptyState.classList.add('hidden');

        contacts.forEach(function(c) {
            const color    = _avatarColor((c.firstName || '') + (c.lastName || ''));
            const initials = _initials(c.firstName, c.lastName);

            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td class="avatar-col">' +
                    '<div class="contact-avatar" style="background:' + color + '">' + initials + '</div>' +
                '</td>' +
                '<td class="name-cell">' + _esc(c.firstName) + '</td>' +
                '<td>'                   + _esc(c.lastName)  + '</td>' +
                '<td class="muted-cell">' + _esc(c.phone)    + '</td>' +
                '<td class="muted-cell">' + _esc(c.email)    + '</td>' +
                '<td class="muted-cell">' + _esc(c.address)  + '</td>' +
                '<td class="actions-cell">' +
                    '<button class="btn btn-secondary btn-icon edit-btn"   title="Edit"   data-id="' + c.id + '">' + ICON_EDIT   + '</button>' +
                    '<button class="btn btn-danger    btn-icon delete-btn" title="Delete" data-id="' + c.id + '">' + ICON_DELETE + '</button>' +
                '</td>';
            tbody.appendChild(tr);
        });

        // Bind row action buttons
        tbody.querySelectorAll('.edit-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const contact = _allContacts.find(function(c) { return c.id === parseInt(btn.dataset.id); });
                if (contact) openModal(contact);
            });
        });
        tbody.querySelectorAll('.delete-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                deleteContact(parseInt(btn.dataset.id));
            });
        });
    }

    // ── Load contacts
    function loadContacts() {
        const myId = ++_requestId;
        hideBanner();
        setLoading(true);
        _lastAction = loadContacts;

        const fxhr = buildFxhr();
        fxhr.open('GET', '/contacts');

        fxhr.onload = function() {
            if (myId !== _requestId) return; // stale response — discard
            setLoading(false);
            if (fxhr.status === 200) {
                const body = JSON.parse(fxhr.responseText);
                _allContacts = body.contacts;
                renderContacts(_allContacts);
            } else if (fxhr.status === 401) {
                handleSessionExpired();
            } else {
                showBanner('Failed to load contacts', 'error', loadContacts);
            }
        };

        fxhr.onerror = function() {
            if (myId !== _requestId) return;
            setLoading(false);
            showBanner('Network error — could not load contacts', 'error', loadContacts);
        };

        fxhr.send(null);
    }

    // ── Add / Update contact
    function saveContact(e) {
        e.preventDefault();
        hideModalBanner();

        if (!firstNameEl.value.trim()) {
            firstNameErr.textContent = 'First name is required';
            firstNameEl.classList.add('invalid');
            return;
        }
        firstNameErr.textContent = '';
        firstNameEl.classList.remove('invalid');

        const id = contactIdEl.value ? parseInt(contactIdEl.value) : null;
        const fields = {
            firstName: firstNameEl.value.trim(),
            lastName:  lastNameEl.value.trim(),
            phone:     phoneEl.value.trim(),
            email:     emailEl.value.trim(),
            address:   addressEl.value.trim()
        };

        setModalLoading(true);

        const fxhr = buildFxhr();
        if (id) {
            fxhr.open('PUT', '/contacts/' + id);
        } else {
            fxhr.open('POST', '/contacts');
        }

        fxhr.onload = function() {
            setModalLoading(false);
            if (fxhr.status === 200 || fxhr.status === 201) {
                closeModal();
                loadContacts();
            } else if (fxhr.status === 401) {
                closeModal();
                handleSessionExpired();
            } else {
                const body = JSON.parse(fxhr.responseText);
                showModalBanner(body.message || 'Save failed', 'error');
            }
        };

        fxhr.onerror = function() {
            setModalLoading(false);
            showModalBanner('Network error — please try again', 'error');
        };

        fxhr.send(fields);
    }

    // ── Delete contact
    function deleteContact(contactId) {
        if (!confirm('Delete this contact?')) return;

        hideBanner();
        const myId = ++_requestId;

        const fxhr = buildFxhr();
        fxhr.open('DELETE', '/contacts/' + contactId);

        fxhr.onload = function() {
            if (myId !== _requestId) return;
            if (fxhr.status === 200) {
                loadContacts();
            } else if (fxhr.status === 401) {
                handleSessionExpired();
            } else {
                showBanner('Could not delete contact', 'error', function() { deleteContact(contactId); });
            }
        };

        fxhr.onerror = function() {
            if (myId !== _requestId) return;
            showBanner('Network error — could not delete', 'error', function() { deleteContact(contactId); });
        };

        fxhr.send(null);
    }

    // ── Session expiry
    function handleSessionExpired() {
        window.AppSession = null;
        alert('Your session has expired. Please log in again.');
        Router.navigate('login');
    }

    // ── Search
    searchInput.addEventListener('input', function() {
        const q = searchInput.value.toLowerCase().trim();
        if (!q) {
            renderContacts(_allContacts);
            return;
        }
        const filtered = _allContacts.filter(function(c) {
            return (c.firstName + ' ' + c.lastName + ' ' + c.phone + ' ' + c.email)
                .toLowerCase().includes(q);
        });
        renderContacts(filtered);
    });

    // ── Modal open / close
    function openModal(contact) {
        hideModalBanner();
        firstNameErr.textContent = '';
        firstNameEl.classList.remove('invalid');

        if (contact) {
            modalTitle.textContent = 'Edit Contact';
            contactIdEl.value      = contact.id;
            firstNameEl.value      = contact.firstName || '';
            lastNameEl.value       = contact.lastName  || '';
            phoneEl.value          = contact.phone     || '';
            emailEl.value          = contact.email     || '';
            addressEl.value        = contact.address   || '';
        } else {
            modalTitle.textContent = 'Add Contact';
            contactIdEl.value      = '';
            contactForm.reset();
        }

        modalOverlay.classList.remove('hidden');
        firstNameEl.focus();
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
        setModalLoading(false);
    }

    // ── Event bindings
    addBtn.addEventListener('click', function() { openModal(null); });

    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) closeModal();
    });

    contactForm.addEventListener('submit', saveContact);

    logoutBtn.addEventListener('click', function() {
        window.AppSession = null;
        Router.navigate('login');
    });

    // ── Initial load
    loadContacts();
}
