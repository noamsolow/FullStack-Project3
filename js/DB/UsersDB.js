// users-db.js
// Users Database API — stores user records in localStorage.
// Only accessed by users-server.js. Never called directly from client code.

// ── localStorage keys
const USERS_KEY    = 'contacts_app__users';
const USERS_ID_KEY = 'contacts_app__users_next_id';

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

// ── Private helpers
function _loadUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function _saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function _nextUserId() {
    const current = parseInt(localStorage.getItem(USERS_ID_KEY) || '1', 10);
    localStorage.setItem(USERS_ID_KEY, String(current + 1));
    return current;
}

// ── Public DB API
window.UsersDB = {

    // Find a user by username. Returns the user object or null.
    findUser: function(username) {
        const users = _loadUsers();
        return users.find(u => u.username === username) || null;
    },

    // Check whether a username is already taken.
    userExists: function(username) {
        return UsersDB.findUser(username) !== null;
    },

    // Add a new user. Throws if username already exists.
    // Expects: {username, passwordHash, fullName, email}
    // Returns: the new user object (including generated id).
    addUser: function({ username, passwordHash, fullName, email }) {
        if (UsersDB.userExists(username)) {
            throw new Error('Username already exists: ' + username);
        }
        const users = _loadUsers();
        const newUser = {
            id:           _nextUserId(),
            username:     username,
            passwordHash: passwordHash,
            fullName:     fullName,
            email:        email
        };
        users.push(newUser);
        _saveUsers(users);
        return newUser;
    },

    // Validate login credentials.
    // Expects a pre-hashed password (client hashes before sending, same as register).
    // Compares the provided hash directly to the stored hash.
    // Returns the user object on success, null on failure.
    validateCredentials: function(username, passwordHash) {
        const user = UsersDB.findUser(username);
        if (!user) return null;
        if (user.passwordHash !== passwordHash) return null;
        return user;
    }
};
