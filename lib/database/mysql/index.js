const logger = require('../../logger');
const {Sequelize} = require("sequelize");

class MysqlClient {
   #isConnected;
   #logging;
   #client;

    init(config) {
        this.#isConnected = false;
        config.application.database.mysql.logging === "false" ? this.#logging = false : this.#logging = (sql, queryObject)=>{
            logger.info(sql);
        };

        this.#client = new Sequelize(config.application.database.mysql.name,
            config.application.database.mysql.username, config.application.database.mysql.password, {
                dialect: 'mysql',
                logging: this.#logging,
                dialectOptions:{
                    host: config.application.database.mysql.host,
                    port: config.application.database.mysql.port,
                    connectTimeout: config.application.database.mysql.connect_timeout,
                    pool: {
                        max: config.application.database.mysql.pool.max,
                        min: config.application.database.mysql.pool.min,
                        acquire: config.application.database.mysql.pool.acquire,
                        idle: config.application.database.mysql.pool.idle,
                        idleTimeoutMillis: config.application.database.mysql.pool.idle_timeout,
                        evict: config.application.database.mysql.pool.evict
                    },
                    timezone: config.application.database.mysql.timezone
                }
            });
    }

   async connect(){
       try{
           await this.#client.authenticate();
           this.#isConnected = true;
           return this.#isConnected;
       }
       catch (error){
           logger.error({err:error}, error.message);
           return this.#isConnected;
       }

   }

   async close(){
       try{
           await this.#client.close();
           this.#isConnected = false;
           logger.info("Mysql client successfully disconnected...");
           return true;
       }
       catch (error){
           logger.error({err:error}, error.message);
           return false;
       }

   }

   getStatus(){
       return this.#isConnected;
   }

   getClient(){
       return this.#client;
   }
}

const mysqlClient = new MysqlClient();
module.exports = mysqlClient