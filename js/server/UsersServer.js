// users-server.js



window.SessionStore = {};

function _generateToken() {
    return Math.random().toString(36).slice(2) +
           Math.random().toString(36).slice(2);
}

window.UsersServer = {


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
        if (!username || !passwordHash) {
            return { status: 400, body: { message: 'Username and password are required' } };
        }

        const user = UsersDB.validateCredentials(username, passwordHash);
        if (!user) {
            return { status: 401, body: { message: 'Invalid username or password' } };
        }

        const token = _generateToken();
        SessionStore[token] = { userId: user.id, fullName: user.fullName };

        return {
            status: 200,
            body: { token: token, userId: user.id, fullName: user.fullName }
        };
    },

    _register: function({ username, passwordHash, fullName, email }) {
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
