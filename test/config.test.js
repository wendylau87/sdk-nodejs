const assert = require('assert')
const config = require('../lib/config');

describe('Test load local config',function() {
    it('should not throw error', async function () {
        this.timeout(1000);
        config.getLocalConfig();
    });
});

describe('Test load consul and replace local config',function() {
    it('should not throw error', async function () {
        this.timeout(3000);
        await config.loadAndReplaceConfig();
    });
});