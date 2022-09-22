const task = async () =>{
    const path = require("path");
    const moment = require("moment-timezone");
    const logger = require(path.resolve(__dirname)+"/lib/logger");
    const startTime = moment().tz("ASIA/JAKARTA").format("YYYY-MM-DD HH:mm:ss.SSS");
    this.workerData.start_time = startTime;
    logger.info(`New Task start at [${startTime}] Worker ID : [${this.workerData.id}]`);

    try{
        /** Do your code/task logic here */
        await new Promise(r => setTimeout(r, 3000));
        logger.info(`Partition data ${this.workerData.partition_key}`)

        /** End your code*/
    }
    catch (error){
        logger.error(error, error.message);
        error.workerData = this.workerData
        throw error;
    }
    return this.workerData;
}

module.exports = task;
