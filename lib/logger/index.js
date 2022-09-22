const pino = require('pino');
const moment = require('moment-timezone');
const config = require('../config');
const localConfig = config.getLocalConfig();

class Logger {
    #pino
    #context

    constructor(pino) {
        this.#pino = pino
    }

    setContext(ctx) {
        this.#context = ctx
    }

    getContext() {
        return this.#context;
    }

    get() {
        return this.#pino;
    }

    //without context
    info(message) {
        this.#pino.info({
            keyword: {
                'message': message
            }
        });
    }

    debug(message) {
        this.#pino.debug({
            keyword: {
                'message': message
            }
        });
    }

    trace(message) {
        this.#pino.trace({
            keyword: {
                'message': message
            }
        });
    }

    warn(err, message) {
        this.#pino.warn({err: err}, {'message': message});
    }

    error(err, message) {
        this.#pino.error({err: err}, {'message': message});
    }


    fatal(err, message) {
        this.#pino.fatal({err: err}, {'message': message});
    }

    //with context
    infoWithContext(ctx, message) {
        this.#pino.info({
            keyword: {
                id: ctx['x-request-id'],
                message: message
            }
        });
    }

    debugWithContext(ctx, message) {
        this.#pino.debug({'id': ctx['x-request-id'], 'message': message});
    }

    traceWithContext(ctx, message) {
        this.#pino.trace({'id': ctx['x-request-id'], 'message': message});
    }

    warnWithContext(ctx, message) {
        this.#pino.warn({'id': ctx['x-request-id'], 'message': message});
    }

    warnWithContext(ctx, err, message) {
        this.#pino.warn({err: err}, {'id': ctx['x-request-id'], 'message': message});
    }

    errorWithContext(ctx, message) {
        this.#pino.error({'id': ctx['x-request-id']}, {'id': ctx['x-request-id'], 'message': message});
    }

    errorWithContext(ctx, err, message) {
        // this.#pino.error({err:err}, {'id':ctx['x-request-id'],'message':message});
        this.#pino.error({err: err}, {
            id: ctx['x-request-id'],
            message: message
        });
    }

    fatalWithContext(ctx, message) {
        this.#pino.fatal({'id': ctx['x-request-id'], 'message': message});
    }

    fatalWithContext(ctx, err, message) {
        this.#pino.fatal({err: err}, {'id': ctx['x-request-id'], 'message': message});
    }
}


const loggerpino = pino(
    {
        level : config.get().application.logger.level,
        messageKey: 'keyword',
        timestamp: () => `,"@timestamp":"${moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss.SSS')}"`,
        formatters: {
            level(label, number) {
                return {'log.level': label}
            },
            bindings(bindings) {
                const {
                    // `pid` and `hostname` are default bindings, unless overriden by
                    // a `base: {...}` passed to logger creation.
                    pid,
                    hostname,
                    group,
                    // name is defined if `log = pino({name: 'my name', ...})`
                    name,
                    // Warning: silently drop any "ecs" value from `base`. See
                    // "ecs.version" comment below.
                    ecs,
                    ...ecsBindings
                } = bindings

                if (group === undefined) {
                    ecsBindings.base = {
                        group: "application",
                        service: localConfig.service,
                        hostname: hostname,
                        pid: pid
                    }
                }
                return ecsBindings
            },
        }
    }
);

const logger = new Logger(loggerpino);
module.exports = logger;