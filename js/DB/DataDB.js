// data-db.js
// Contacts Database API — stores contact records in localStorage.
// Only accessed by data-server.js. Never called directly from client code.

// ── localStorage keys
const CONTACTS_KEY    = 'contacts_app__contacts';
const CONTACTS_ID_KEY = 'contacts_app__contacts_next_id';

// ── Private helpers
function _loadContacts() {
    return JSON.parse(localStorage.getItem(CONTACTS_KEY) || '[]');
}

function _saveContacts(contacts) {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
}

function _nextContactId() {
    const current = parseInt(localStorage.getItem(CONTACTS_ID_KEY) || '1', 10);
    localStorage.setItem(CONTACTS_ID_KEY, String(current + 1));
    return current;
}

// ── Public DB API
window.DataDB = {

    // Get all contacts belonging to a user.
    getAll: function(userId) {
        return _loadContacts().filter(c => c.userId === userId);
    },

    // Get a single contact by id. Enforces userId so users can't read each other's data.
    // Returns the contact object or null.
    getOne: function(contactId, userId) {
        const contacts = _loadContacts();
        return contacts.find(c => c.id === contactId && c.userId === userId) || null;
    },

    // Add a new contact for a user.
    // Expects: {userId, firstName, lastName, phone, email, address}
    // Returns: the new contact object (including generated id).
    add: function({ userId, firstName, lastName, phone, email, address }) {
        const contacts = _loadContacts();
        const newContact = {
            id:        _nextContactId(),
            userId:    userId,
            firstName: firstName || '',
            lastName:  lastName  || '',
            phone:     phone     || '',
            email:     email     || '',
            address:   address   || ''
        };
        contacts.push(newContact);
        _saveContacts(contacts);
        return newContact;
    },

    // Update an existing contact. Only updates fields provided in `fields`.
    // Enforces userId ownership check.
    // Returns the updated contact or null if not found.
    update: function(contactId, userId, fields) {
        const contacts = _loadContacts();
        const idx = contacts.findIndex(c => c.id === contactId && c.userId === userId);
        if (idx === -1) return null;
        // Merge only the allowed fields
        const allowed = ['firstName', 'lastName', 'phone', 'email', 'address'];
        allowed.forEach(key => {
            if (fields[key] !== undefined) {
                contacts[idx][key] = fields[key];
            }
        });
        _saveContacts(contacts);
        return contacts[idx];
    },

    // Delete a contact by id. Enforces userId ownership.
    // Returns true if deleted, false if not found.
    remove: function(contactId, userId) {
        const contacts = _loadContacts();
        const idx = contacts.findIndex(c => c.id === contactId && c.userId === userId);
        if (idx === -1) return false;
        contacts.splice(idx, 1); 
        _saveContacts(contacts);
        return true;
    }
};
