const config = require('./lib/config');
const base36 = require('./lib/base36');
const crc = require('./lib/crc');
const cryptoJS = require('./lib/cryptoJS');
const httpCaller = require('./lib/httpCaller');
const {integrationAttachResponseBody, integrationAttachContext, httpLogger} = require('./lib/httpLogger');
const kafkaClient = require('./lib/kafka');
const logger = require('./lib/logger');
const {asyncLocalStorage, integrationGenerateContext} = require('./lib/context');
const mysqlClient = require('./lib/database/mysql');
const redisClient = require('./lib/redisClient');
const uuidGen = require('./lib/uuidGen');
const utils = require('./lib/utils');

module.exports = {
    asyncLocalStorage,
    base36,
    config,
    crc,
    cryptoJS,
    httpCaller,
    httpLogger,
    integrationAttachContext,
    integrationAttachResponseBody,
    integrationGenerateContext,
    kafkaClient,
    logger,
    mysqlClient,
    redisClient,
    utils,
    uuidGen
}