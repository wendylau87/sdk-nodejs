const { Kafka } = require('kafkajs')
const { v4: uuidv4 } = require('uuid');
const logger= require('../logger');
const config = require('../config')

const MyLogCreator = logLevel => ({ namespace, level, label, log }) => {
    logger.info(log)
}

class KafkaClient{
    #client;
    #producer;
    #consumer;
    #groupId;
    #podName;
    #sessionTimeout;
    init(config) {
        this.#groupId = config.service;
        this.#podName = config.pod === "default" ? uuidv4() : pod;
        this.#sessionTimeout = parseInt(config.application.kafka.consumer.heartbeat_timeout);
        const brokers = ()=>{
            let brokerList = [];
            for (const key in config.application.kafka.brokers) {
                brokerList.push(`${config.application.kafka.brokers[key].host}:${config.application.kafka.brokers[key].port}`);
            }
            return brokerList;
        }

        this.#client = new Kafka({
            clientId: `[${this.#groupId}]-[${this.#podName}]`,
            brokers: brokers,
            logCreator: MyLogCreator
        })

        this.#producer = this.#client.producer();
        this.#consumer = this.#client.consumer({ groupId: this.#groupId})
    }

    async isHealthy(){
        if (Date.now() - this.lastHeartbeat < this.#sessionTimeout) {
            return true;
        }

        // Consumer has not heartbeat, but maybe it's because the group is currently rebalancing
        try {
            const { state } = await this.#consumer.describeGroup();
            return ['CompletingRebalance', 'PreparingRebalance'].includes(state);
        } catch (error) {
            logger.error(error, error.message);
            return false;
        }
    }

    async consumerConnect(){
        try{
            await this.#consumer.connect();
            const { HEARTBEAT } = this.#consumer.events;
            this.#consumer.on(HEARTBEAT, ({ timestamp }) => this.lastHeartbeat = timestamp);
            logger.info('Kafka Consumer successfully open connection...')
        }
        catch (error){
            logger.error({err:error}, error.message)
            throw new Error('Kafka Consumer failed open connection...')
        }
    }

    async producerConnect(){
        try{
            await this.#producer.connect();
            logger.info('Kafka Producer successfully open connection...')
        }
        catch (error){
            logger.error({err:error}, error.message)
            throw new Error('Kafka Producer failed open connection...')
        }

    }

    async disconnect(){
        try{
            await Promise.all([this.#consumer.disconnect(), this.#producer.disconnect()]);
            logger.info("Kafka client successfully disconnect...");
        }
        catch (error){
            logger.error({err:error}, error.message)
            throw new Error('Kafka client failed disconnect...')
        }

    }

    async subscribe(topic){
        await this.#consumer.subscribe({
            topic: topic,
            fromBeginning: true
        })
    }

    async sendMessage(topic, message, partition=0){
        await this.#producer.send({
            topic: topic,
            messages: [
                { value: message, partition: partition }
            ],
        })
    }

    async run(param){
        return this.#consumer.run(param);
    }

    getConsumer(){
        return this.#consumer;
    }
}
const kafkaClient = new KafkaClient();
module.exports = kafkaClient