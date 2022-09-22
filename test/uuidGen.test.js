const uuidGen = require('../lib/uuidGen')
const assert  = require('assert');

describe('Test generate random uuid',function() {
    it('should not throw error', async function () {
        const res = uuidGen.new()
        assert.equal(res.length,36);
    });
});