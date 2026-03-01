function hashPassword(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & hash; // force 32-bit integer
    }

    return String(hash >>> 0); // unsigned 32-bit, always positive string
};