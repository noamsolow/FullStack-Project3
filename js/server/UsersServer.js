// users-server.js
// Auth Server — handles user login and registration requests.
// Exposes: window.UsersServer and window.SessionStore

// ── Session Store
// Shared with data-server.js for token validation.
// Shape: { "<token>": { userId, fullName }, ... }
// In-memory only — clears on page refresh (correct behavior).
window.SessionStore = {};

// ── Token generator
function _generateToken() {
    return Math.random().toString(36).slice(2) +
           Math.random().toString(36).slice(2);
}

// ── Auth Server
window.UsersServer = {

    // Main entry point called by Network.
    // request: { method, url, headers, body }
    // Returns: { status, body }
    handle: function(request) {
        const { method, url, body } = request;

        if (method === 'POST' && url === '/users/login') {
            return UsersServer._login(body);
        }
        if (method === 'POST' && url === '/users/register') {
            return UsersServer._register(body);
        }
        return { status: 404, body: { message: 'Not found' } };
    },

    _login: function({ username, passwordHash }) {
        // Validate required fields
        if (!username || !passwordHash) {
            return { status: 400, body: { message: 'Username and password are required' } };
        }

        const user = UsersDB.validateCredentials(username, passwordHash);
        if (!user) {
            return { status: 401, body: { message: 'Invalid username or password' } };
        }

        // Create session
        const token = _generateToken();
        SessionStore[token] = { userId: user.id, fullName: user.fullName };

        return {
            status: 200,
            body: { token: token, userId: user.id, fullName: user.fullName }
        };
    },

    _register: function({ username, passwordHash, fullName, email }) {
        // Validate required fields
        if (!username || !passwordHash || !fullName) {
            return { status: 400, body: { message: 'Username, password, and full name are required' } };
        }

        if (UsersDB.userExists(username)) {
            return { status: 409, body: { message: 'Username already taken' } };
        }

        UsersDB.addUser({ username, passwordHash, fullName, email: email || '' });
        return { status: 201, body: { message: 'User registered successfully' } };
    }
};
