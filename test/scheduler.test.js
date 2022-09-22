const scheduler = require("../lib/scheduler");
const assert = require("assert");
const path = require("path");
const basePath = path.resolve(__dirname+"/scheduler");
const config = require("../lib/config");
config.loadAndReplaceConfig();

describe('Test scheduler verify function',function() {
    it('must return true', async function () {
        this.timeout(3000);
        const res = await scheduler.verify();
        assert.equal(res, true);
    });
});

describe('Test scheduler initialize pool',function() {
    it('must not throw error', function () {
        scheduler.initiatePool(basePath);
    });
});

describe('Test scheduler running',function() {
    it('must not throw error', async function () {
        this.timeout(20000);
        scheduler.runAllTopics();
    });
});

describe('Test scheduler shutdown all threads',function() {
    it('must not throw error', async function () {
        this.timeout(10000);
        const res = await scheduler.terminate();
        assert.equal(res, true);
    });
});
