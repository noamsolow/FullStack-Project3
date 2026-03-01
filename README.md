# FullStack-Project3 — Contacts Manager

**Course:** Full-Stack Web Development — Chapter 3 (Units 11–20)
**Lecturer:** Prof. Shlomo Kipnis, Lev Academic Center
**Authors:** Noam Solow + partner

---

## How to Run

Open `index.html` in a browser. No server, no npm, no build step needed.

> **Note:** Use a local dev server (e.g. VS Code Live Server) if `fetch()` for HTML fragments is blocked by CORS on `file://`. Alternatively open via `http://localhost`.

---

## What This Project Is

A **functional end-to-end simulation** of a client-server architecture — entirely in the browser.

- The **client** is a Single Page Application (SPA) with Login, Register, and Contacts screens
- The **server** is simulated JavaScript code that handles REST-style requests
- The **database** is localStorage, accessed only through a defined DB-API
- The **network** is simulated with random delays (1–3s) and random message drops (configurable)
- All client↔server communication goes through **FAJAX** — a custom `FXMLHttpRequest` class

---

## Architecture

```
User Action
    ↓
Page Controller (login-page.js / register-page.js / contacts-page.js)
    ↓
FXMLHttpRequest (fajax.js)
    ↓
Network.send() (network.js)  ←— random delay 1–3s, random drop 10–50%
    ↓
UsersServer.handle() or DataServer.handle() (users-server.js / data-server.js)
    ↓
UsersDB or DataDB (users-db.js / data-db.js)
    ↓
localStorage
    ↑
Network returns response ←— random delay 1–3s, random drop 10–50%
    ↑
fxhr.onload() or fxhr.onerror()
    ↑
UI update
```

---

## File Structure

```
FullStack-Project3/
├── index.html                # SPA shell — loaded once, never reloaded
├── README.md
│
├── css/
│   └── style.css             # All styles
│
│
└── js/
    ├── app.js                # Entry point — DOMContentLoaded, globals, Router.init()
    ├── router.js             # Hash-based SPA router with auth guard
    │
    ├── db/                   # Storage layer — localStorage access only
    │   ├── users-db.js       # Users DB API + hashPassword
    │   └── data-db.js        # Contacts DB API
    │
    ├── server/               # Simulated server layer
    │   ├── users-server.js   # Auth server — login / register + SessionStore
    │   └── data-server.js    # Data server — contacts CRUD
    │
    ├── network/              # Communication layer
    │   ├── network.js        # Network simulator (delay + drop + routing)
    │   └── fajax.js          # FXMLHttpRequest class (FAJAX)
    │
    └── pages/                # Page controllers (one per screen)
        ├── login-page.js     # Login screen controller
        ├── register-page.js  # Register screen controller
        └── contacts-page.js  # Contacts screen controller
```

### Script Load Order in index.html

```
db/users-db.js → db/data-db.js → server/users-server.js → server/data-server.js
→ network/network.js → network/fajax.js → router.js
→ pages/login-page.js → pages/register-page.js → pages/contacts-page.js → app.js
```

---

## Component API Reference

### `window.UsersDB` (users-db.js)

| Method | Returns |
|--------|---------|
| `UsersDB.addUser({username, passwordHash, fullName, email})` | new user object |
| `UsersDB.findUser(username)` | user object or `null` |
| `UsersDB.userExists(username)` | `boolean` |
| `UsersDB.validateCredentials(username, password)` | user object or `null` |

localStorage keys: `contacts_app__users`, `contacts_app__users_next_id`
User shape: `{id, username, passwordHash, fullName, email}`

### `window.hashPassword(str)` (users-db.js)

Simple djb2 hash. Used by `users-db.js` (storage) and `login-page.js` (before sending).

---

### `window.DataDB` (data-db.js)

| Method | Returns |
|--------|---------|
| `DataDB.getAll(userId)` | array of contacts |
| `DataDB.getOne(contactId, userId)` | contact or `null` |
| `DataDB.add({userId, firstName, lastName, phone, email, address})` | new contact |
| `DataDB.update(contactId, userId, fields)` | updated contact or `null` |
| `DataDB.remove(contactId, userId)` | `true` / `false` |

localStorage keys: `contacts_app__contacts`, `contacts_app__contacts_next_id`
Contact shape: `{id, userId, firstName, lastName, phone, email, address}`

---

### `window.UsersServer` + `window.SessionStore` (users-server.js)

```
UsersServer.handle(request) → response
  request: {method, url, headers, body}
  response: {status, body}

POST /users/login    → 200 {token, userId, fullName} | 401 {message}
POST /users/register → 201 {message}                 | 409 {message}
```

`SessionStore` is a plain object `{ token → {userId, fullName} }`, shared with `data-server.js`.

---

### `window.DataServer` (data-server.js)

```
DataServer.handle(request) → response
  All routes require: headers.Authorization = "Bearer <token>"
  Invalid token → 401 {message: "Unauthorized"}

GET    /contacts      → 200 {contacts: [...]}
GET    /contacts/:id  → 200 {contact: {...}} | 404
POST   /contacts      → 201 {contact: {...}}
PUT    /contacts/:id  → 200 {contact: {...}} | 404
DELETE /contacts/:id  → 200 {message}        | 404
```

---

### `window.Network` (network.js)

```
Network.dropRate = 0.2    // 0.1 to 0.5
Network.minDelay = 1000   // ms
Network.maxDelay = 3000   // ms

Network.send(fxhr)
  Applies delay + possible drop on request trip,
  then delay + possible drop on response trip.
  Routes by URL: /users/* → UsersServer, /contacts* → DataServer
```

---

### `class FXMLHttpRequest` (fajax.js)

```javascript
const fxhr = new FXMLHttpRequest();
fxhr.open("POST", "/users/login");
fxhr.setRequestHeader("Authorization", "Bearer " + token);
fxhr.onload = function() { /* fxhr.status, fxhr.responseText */ };
fxhr.onerror = function() { /* network drop */ };
fxhr.send({username, password});
```

---

### `window.Router` (router.js)

```
Router.init()           → starts hash-based routing
Router.navigate(hash)   → navigates to #hash
Router.routes           → {login, register, contacts} → page init functions
```

Auth guard: navigating to `#contacts` without a session redirects to `#login`.

---

### Session (app.js)

```
window.AppSession = null
// or when logged in:
window.AppSession = {token, userId, fullName}
```

In-memory only — clears on page refresh. Users must log in each session.

---

## Error Handling

| Category | Trigger | UI |
|----------|---------|-----|
| Client validation | Empty fields, password mismatch, bad email | Red inline message |
| Network drop | `onerror` fires (status=0) | Banner + Retry button |
| Server 4xx | `onload` fires, status 401/404/409 | Banner with message |
| Stale response | Race condition guard (`_requestId`) | Silently discarded |
| Expired token | DataServer 401 | Auto-logout + redirect |

---

## Race Condition Pattern

All data-loading functions use a `_requestId` counter to discard stale responses:

```javascript
let _requestId = 0;
function loadContacts() {
    const myId = ++_requestId;
    const fxhr = new FXMLHttpRequest();
    fxhr.onload = function() {
        if (myId !== _requestId) return; // stale — discard
        // process response...
    };
    fxhr.open("GET", "/contacts");
    fxhr.setRequestHeader("Authorization", "Bearer " + AppSession.token);
    fxhr.send(null);
}
```

---

## Implementation Checklist

### Phase 1 — Storage Layer
- [ ] `js/users-db.js` — localStorage helpers + UsersDB API + hashPassword
- [ ] `js/data-db.js` — localStorage helpers + DataDB API

### Phase 2 — Server Layer
- [ ] `js/users-server.js` — SessionStore + UsersServer (login/register)
- [ ] `js/data-server.js` — DataServer (CRUD + auth check)

### Phase 3 — Network Layer
- [ ] `js/fajax.js` — FXMLHttpRequest class
- [ ] `js/network.js` — Network singleton (delay + drop + routing)

### Phase 4 — SPA Shell
- [ ] `index.html` — shell with correct script load order
- [ ] `js/app.js` — entry point
- [ ] `js/router.js` — hash router with auth guard

### Phase 5 — HTML & CSS
- [ ] `html/login.html`
- [ ] `html/register.html`
- [ ] `html/contacts.html`
- [ ] `css/style.css`

### Phase 6 — Page Controllers
- [ ] `js/login-page.js`
- [ ] `js/register-page.js`
- [ ] `js/contacts-page.js`

### Phase 7 — Integration Testing
- [ ] Register → Login → Contacts flow
- [ ] Contacts CRUD (add, edit, delete)
- [ ] Client-side search
- [ ] Drop simulation (set dropRate=0.9, verify retry)
- [ ] Race condition (set maxDelay=5000, rapid clicks)
- [ ] Auth guard (clear AppSession, navigate to #contacts)
- [ ] Session clear on refresh
- [ ] Cross-user isolation
- [ ] localStorage key inspection
