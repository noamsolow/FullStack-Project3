// data-server.js
// Data Server — handles all contacts CRUD operations.
// Requires an authenticated session token on every request.
// Exposes: window.DataServer

window.DataServer = {

    // Main entry point called by Network.
    // request: { method, url, headers: { Authorization: "Bearer <token>" }, body }
    // Returns: { status, body }
    handle: function(request) {
        const { method, url, headers, body } = request;

        // ── Auth check (every route)
        const session = DataServer._authenticate(headers);
        if (!session) {
            return { status: 401, body: { message: 'Unauthorized — please log in' } };
        }
        const userId = session.userId;

        // ── Route matching
        // Parse URL: "/contacts" or "/contacts/42"
        const parts   = url.split('/').filter(Boolean); // ['contacts'] or ['contacts','42']
        const resource = parts[0];
        const id       = parts[1] ? parseInt(parts[1], 10) : null;

        if (resource !== 'contacts') {
            return { status: 404, body: { message: 'Not found' } };
        }

        if (method === 'GET'    && id === null)  return DataServer._getAll(userId);
        if (method === 'GET'    && id !== null)  return DataServer._getOne(id, userId);
        if (method === 'POST'   && id === null)  return DataServer._add(userId, body);
        if (method === 'PUT'    && id !== null)  return DataServer._update(id, userId, body);
        if (method === 'DELETE' && id !== null)  return DataServer._remove(id, userId);

        return { status: 400, body: { message: 'Bad request' } };
    },

    // Extract and validate Bearer token from Authorization header.
    // Returns session object { userId, fullName } or null.
    _authenticate: function(headers) {
        if (!headers || !headers['Authorization']) return null;
        const parts = headers['Authorization'].split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
        const token = parts[1];
        return SessionStore[token] || null;
    },

    _getAll: function(userId) {
        const contacts = DataDB.getAll(userId);
        return { status: 200, body: { contacts: contacts } };
    },

    _getOne: function(contactId, userId) {
        const contact = DataDB.getOne(contactId, userId);
        if (!contact) return { status: 404, body: { message: 'Contact not found' } };
        return { status: 200, body: { contact: contact } };
    },

    _add: function(userId, fields) {
        if (!fields || !fields.firstName) {
            return { status: 400, body: { message: 'First name is required' } };
        }
        const contact = DataDB.add({ userId, ...fields });
        return { status: 201, body: { contact: contact } };
    },

    _update: function(contactId, userId, fields) {
        const contact = DataDB.update(contactId, userId, fields);
        if (!contact) return { status: 404, body: { message: 'Contact not found' } };
        return { status: 200, body: { contact: contact } };
    },

    _remove: function(contactId, userId) {
        const deleted = DataDB.remove(contactId, userId);
        if (!deleted) return { status: 404, body: { message: 'Contact not found' } };
        return { status: 200, body: { message: 'Contact deleted' } };
    }
};
