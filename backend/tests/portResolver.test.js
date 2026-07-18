const assert = require('assert');
const { getNextPort } = require('../utils/portResolver');

assert.strictEqual(getNextPort(5000, 0), 5000);
assert.strictEqual(getNextPort(5000, 1), 5001);
assert.strictEqual(getNextPort(5000, 2), 5002);

console.log('portResolver tests passed');
