const mysqlClient = require("../lib/database/mysql");
const assert = require("assert");
const config = require("../lib/config");

describe('Test open database connection',function() {
    it('result must be true', async function () {
        this.timeout(5000);
        const cfg = await config.loadAndReplaceConfig();
        mysqlClient.init(cfg);
        const res = await mysqlClient.connect();
        assert.equal(res, true);
    });
});

describe('Test close database connection',function() {
    it('should must be not throw error', async function () {
        this.timeout(5000);
        await mysqlClient.close();
    });
});