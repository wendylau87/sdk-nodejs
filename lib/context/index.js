const { AsyncLocalStorage } = require("async_hooks");
const asyncLocalStorage = new AsyncLocalStorage();
const uuidGen = require('../uuidGen');

const integrationGenerateContext = (req, res, next) => {
    asyncLocalStorage.run(new Map(), () => {
        const uuid = uuidGen.new();
        asyncLocalStorage.getStore().set("context", {'x-request-id':uuid});
        next();
    });
};

module.exports = {
    asyncLocalStorage,
    integrationGenerateContext,
};