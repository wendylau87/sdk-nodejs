const redis = require('redis');
const logger = require('../logger');
const config = require('../config')

class RedisClient{
    #isConnected;
    #id;

    init(config){
        this.client = redis.createClient({
            socket:{
                host: config.application.redis.host,
                port: config.application.redis.port,
                reconnectStrategy: retries => {
                    if(retries > parseInt(config.application.redis.max_retry)){
                        throw new Error("Redis client has reached maximum retry");
                    }
                    return parseInt(config.application.redis.interval_retry);
                }
            },
        });
        this.#isConnected = false;

        this.client.on('ready', ()=>this.changeToReadyStatus());
        this.client.on('reconnecting', ()=> this.changeToReconnectingStatus());
        this.client.on('error', (err)=> this.changeToErrorStatus(err));
        this.client.on('end', ()=> this.changeToClosed());
    }

    changeToReadyStatus(){
        this.#isConnected = true;
        this.client.clientId().then(res=>{
            this.#id = res;
            logger.info(`Redis client[${this.#id}] ready...`)
        })
    }

    changeToReconnectingStatus(){
        logger.info("Redis client trying to reconnect...")
    }

    changeToErrorStatus(error){
        this.#isConnected = false;
        logger.info("Redis client not ready...")
        logger.error({err:error}, "Redis client error");
    }

    changeToClosed(){
        this.#isConnected = false;
        logger.info(`Redis client[${this.#id}] connection has been closed...`)
    }

    async ping(){
        if(this.#isConnected){
            const resp = await this.client.ping();
            return resp;
        }else{
            return false;
        }
    }

    async connect(){
        if(!this.#isConnected){
            await this.client.connect();
        }
    }

    async quit(){
        if(this.#isConnected){
            await this.client.quit();
        }
        else{
            throw new Error('Redis client not connected');
        }
    }

    async disconnect(){
        if(this.#isConnected){
            await this.client.quit();
        }
        else{
            throw new Error('Redis client not connected');
        }
    }

    async get(key){
        if(this.#isConnected === true){
            return await this.client.get(key);
        }
        else{
            throw new Error('Redis client not connected');
        }
    }

    async set(key, value, ttl=0){
        if(this.#isConnected === true){
            if(ttl === undefined || ttl === null || ttl < 1){
                return await this.client.set(key, value);
            }
            else{
                return await this.client.set(key, value, {EX:ttl});
            }
        }
        else{
            throw new Error('Redis client not connected');
        }
    }

    async delete(key){
        if(this.#isConnected === true){
            return await this.client.del(key);
        }
        else{
            throw new Error('Redis client not connected');
        }
    }
}

const redisClient = new RedisClient();
module.exports = redisClient