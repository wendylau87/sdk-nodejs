const assert = require('assert')
const kafkaClient = require("../lib/kafka");
const kafkaTopic = 'unit-test';
const kafkaMessage = 'example-message';
const waitFor = require('kafkajs/src/utils/waitFor')
const config = require("../lib/config");

describe('Test open kafka producer connection',function() {
    it('should not throw error', async function () {
        this.timeout(5000);
        const cfg = await config.loadAndReplaceConfig();
        kafkaClient.init(cfg);
        await kafkaClient.producerConnect();
    });
});

describe('Test send message to kafka',function() {
    it('should not throw error', async function () {
        this.timeout(5000);
        await kafkaClient.sendMessage(kafkaTopic, kafkaMessage);
    });
});

describe('Test open kafka consumer connection',function() {
    it('should not throw error', async function () {
        this.timeout(5000);
        await kafkaClient.consumerConnect()
    });
});

describe('Test subscribe selected topic',function() {
    it('should not throw error', async function () {
        this.timeout(5000);
        await kafkaClient.subscribe(kafkaTopic);
    });
});

// describe('Test receive message from kafka',function() {
//     it('should not throw error', async function () {
//         this.timeout(5000);
//         await kafkaClient.run({
//             eachMessage: async ({ topic, partition, message }) => {
//                 assert.equal(message, kafkaMessage);
//             },
//         });
//     });
// });
//
// describe('Test receive message from kafka',function() {
//     it('should not throw error', async function () {
//         this.timeout(30000);
//         let consumedMessaged;
//         await kafkaClient.getConsumer().run({
//             eachMessage: async ({ topic, partition, message }) => {
//                 consumedMessaged = message;
//                 console.log(consumedMessaged)
//                 assert.equal(consumedMessaged, kafkaMessage)
//             },
//         });
//
//         //await waitFor(()=>{assert.equal(consumedMessaged,"test")});
//     });
// });

describe('Test disconnect kafka client',function() {
    it('should not throw error', async function () {
        this.timeout(5000);
        await kafkaClient.disconnect()
    });
});


// (async () => {
//     const cfg = await config.loadAndReplaceConfig();
//     kafkaClient.init(cfg);
//     await kafkaClient.consumerConnect()
//     await kafkaClient.subscribe(kafkaTopic);
//     kafkaClient.getConsumer().run({
//         eachMessage: async ({ topic, partition, message }) => {
//             console.log(message.value.toString())
//         },
//     });
// })()