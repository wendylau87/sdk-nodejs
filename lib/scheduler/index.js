const {DynamicPool} = require('node-worker-threads-pool');
const logger = require("../logger");
const config = require("../config");
const utils = require("../utils");
const mysqlClient = require("../database/mysql");
const assignor = require("../assignor").getInstance();
const moment = require("moment-timezone");
const {uuidGen} = require("../../index");
const {ToadScheduler, SimpleIntervalJob, Task} = require("toad-scheduler");
const fs = require('fs');

class Scheduler {
    #threadPool;
    #state;
    #scheduler;
    #taskPool;
    #basePath;
    #threadStatus; //ready, busy

    constructor() {
        this.#taskPool = [];
        this.#threadStatus = [];
        this.#state = 'not ready';
        this.#scheduler = new ToadScheduler();
    }

    initiatePool(basePath) {
        if(this.#state !== 'verified'){
            throw new Error("State must be verified before initialize.");
        }
        this.#basePath = basePath;
        if (!fs.existsSync(basePath)) {
            throw new Error(`Directory [${basePath}] not exists.`);
        }
        const listTask = config.get().scheduler.task;
        if (utils.isObject(listTask)) {
            let totalWorkerCount = 0;
            for (const taskName in listTask) {
                const task = config.get().scheduler.task[taskName];
                if (!(this.#taskPool[taskName] === undefined || this.#taskPool[taskName] === null)) {
                    throw new Error("Duplicate task/topic name.");
                }
                if (!fs.existsSync(`${this.#basePath}/${taskName}.js`)) {
                    throw new Error(`File [${this.#basePath}/${taskName}.js] not exists.`);
                }
                this.#taskPool[taskName] = {
                    task: `${this.#basePath}/${taskName}`,
                    topic: taskName,
                    worker_count: task.worker_count,
                    interval: task.interval,
                    timeout: task.timeout,
                    max_partition: task.max_partition,
                };
                totalWorkerCount += parseInt(task.worker_count);

                //setup worker status
                for(let i=0; i<parseInt(task.worker_count);i++){
                    this.#threadStatus[`${taskName}-${i}`] ='ready';
                }
            }
            this.#threadPool = new DynamicPool(totalWorkerCount);
            this.#state = 'ready';
        }
    }

    async verify() {
        try {
            await mysqlClient.getClient().query(`select * from scheduler`);
            this.#state = 'verified';
            return true;
        } catch (error) {
            logger.error({err: error}, error.message);
            return false;
        }
    }

    #validateWorkerData(data) {
        if (data.id === undefined || data.id === null) {
            return false;
        }
        if (data.name === undefined || data.name === null) {
            return false;
        }
        if (!data.pod_id === undefined || data.pod_id === null) {
            return false;
        }
        if (!data.pod_position === undefined || data.pod_position === null) {
            return false;
        }
        if (!data.partition_key === undefined || data.partition_key === null) {
            return false;
        }
    }

    async runTask(task, data) {
        if(typeof task !== "function"){
            throw new Error(`Task must be function instead ${typeof task}`);
        }
        if (this.#state === 'not ready') {
            throw new Error("You must run verify function then initialize first to enable scheduler");
        }
        else if(this.#state === 'verified'){
            throw new Error("You must run initialize function first to enable scheduler");
        }
        else if (this.#state === 'ready') {
            if (this.#validateWorkerData(data) === false) {
                throw new Error("Worker data not valid");
            }
            try {
                const res = await this.#threadPool.exec({
                    task: task,
                    workerData: data
                });

                const endTime = moment().tz("ASIA/JAKARTA").format("YYYY-MM-DD HH:mm:ss.SSS");
                data.start_time = res.start_time;
                data.finish_time = endTime;
                data.status = 'SUCCESS';
                logger.info(`Finished task at [${endTime}] Worker ID : [${data.id}]`)
            } catch (error) {
                const endTime = moment().tz("ASIA/JAKARTA").format("YYYY-MM-DD HH:mm:ss.SSS");
                data.start_time = error.workerData.start_time;
                data.finish_time = endTime;
                data.status = 'FAILED';
                data.error = JSON.stringify(error.stack)
                logger.error(error, `Task finished with error at [${endTime}] Worker ID : [${data.id}]`);
            } finally {
                //Logging to database
                mysqlClient.getClient().query(`INSERT INTO scheduler(id, task_id, task_name, start_time, finish_time, status, error_message, pod_id, pod_position, partition_key) VALUES(?,?,?,?,?,?,?,?,?,?)`, {
                    replacements: [
                        uuidGen.new(),
                        data.id,
                        data.name,
                        data.start_time,
                        data.finish_time,
                        data.status,
                        data.error,
                        data.pod_id,
                        data.pod_position,
                        JSON.stringify(data.partition_key)
                    ]
                }).catch(error => {
                    logger.error(error, "Failed log scheduler task");
                });
            }
            return data;

        } else {
            logger.info("Scheduler forbidden to run new task");
        }
    }

    async terminate() {
        if (this.#state === 'ready' || this.#state === 'not ready') {
            this.#state = 'terminate';
            const workers = this.#threadPool.workers;
            let gracefulShutdown = true;

            //stop all scheduler
            this.#scheduler.stop();

            //check active workers before destroy
            while (true) {
                for (const worker of workers) {
                    if (worker.ready === false) {
                        gracefulShutdown = false;
                    }
                }
                if (gracefulShutdown) {
                    //destroy all workers
                    await this.#threadPool.destroy();
                    return true;
                }
                await utils.delay(1000);
                gracefulShutdown = true;
            }
        }
    }

    async runAllTopics() {
        //Run all registered scheduler topic using run task
        let taskList = [];
        for (const key in this.#taskPool) {
            //Define ToadSchedulerTask
            const toadSchedulerTask = new Task(key, async ()=>{
                const assignedPartition = await assignor.getAssignedPartition(this.#taskPool[key].topic, this.#taskPool[key].max_partition);
                let partitionKeys = [];

                //Divide assigned partition by worker count then assign partition key for every worker
                for(let i=0; i<assignedPartition.length; i++){
                    const index = i % this.#taskPool[key].worker_count;
                    if(!partitionKeys[index]){
                        partitionKeys[index] = [];
                    }
                    partitionKeys[index].push(assignedPartition[i]);
                }

                //Pass task/function and data to worker
                for (let i = 0; i < this.#taskPool[key].worker_count; i++) {
                    const workerData = {
                        id: `${key}-${i}`,
                        name: key,
                        pod_id: assignor.getIdentifier(),
                        pod_position: assignor.getPosition(),
                        partition_key: partitionKeys[i]
                    }
                    //Check worker status using task-id before run task
                    if(this.#threadStatus[workerData.id] !== 'ready'){
                        logger.info(`Can't assign new task to worker [${key}-${i}] because previous task not finished.`);
                    }
                    else{
                        //If previous worker have finished / not busy then run task then set worker status busy
                        this.#threadStatus[workerData.id] = 'busy';
                        const task = require(this.#taskPool[key].task);
                        this.runTask(task, workerData)
                            .then(res =>{
                            })
                            .catch(err =>{
                                throw err;
                            })
                            .finally(()=>{
                                this.#threadStatus[workerData.id] = 'ready';
                            });
                    }

                }
            })

            //Create job by ToadSchedulerTask
            const job = new SimpleIntervalJob({
                milliseconds: parseInt(this.#taskPool[key].interval),
                runImmediately: true
            }, toadSchedulerTask)

            //Assign job to scheduler
            this.#scheduler.addSimpleIntervalJob(job);
        }

    }
}

const scheduler = new Scheduler();
module.exports = scheduler;