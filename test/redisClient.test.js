const assert = require('assert')
const redisClient = require("../lib/redisClient");
const config = require("../lib/config");
const exampleKey = 'key-unit-test';
const exampleValue = 'value-unit-test';


describe('Test open redis connection',function() {
    it('should not throw error', async function () {
        this.timeout(5000);
        const cfg = await config.loadAndReplaceConfig();
        redisClient.init(cfg);
        await redisClient.connect();
    });
});

describe('Test ping to redis',function() {
    it('should return "PONG"', async function () {
        this.timeout(5000);
        const res = await redisClient.ping();
        assert.equal(res,"PONG");
    });
});

describe('Test insert data to redis',function() {
    it('should not throw error', async function () {
        this.timeout(5000);
        await redisClient.set(exampleKey, exampleValue);
    });
});

describe('Test get data from redis',function() {
    it(`should be ${exampleValue}`, async function () {
        this.timeout(5000);
        const data = await redisClient.get(exampleKey);
        assert.equal(exampleValue, data);
    });
});

describe('Test delete key from redis',function() {
    it(`should be 1`, async function () {
        this.timeout(5000);
        const data = await redisClient.delete(exampleKey);
        assert.equal(1, data);
    });
});


describe('Test close redis connection',function() {
    it('should not throw error', async function () {
        this.timeout(5000);
        await redisClient.disconnect();
    });
});

describe('Test quit client redis',function() {
    it('should not throw error', async function () {
        this.timeout(5000);
        await redisClient.connect();
        await redisClient.quit();
    });
});
