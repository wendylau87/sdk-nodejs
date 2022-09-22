const { KubeConfig } = require('kubernetes-client');
const Request = require('kubernetes-client/backends/request');
const Client = require('kubernetes-client').Client;
const logger = require('../logger');
const config = require("../config")

class PrivateAssignor{
    constructor() {
        this.currentPod = process.env.HOSTNAME != undefined ? process.env.HOSTNAME : config.service;
        this.namespace = process.env.NAMESPACE === null || process.env.NAMESPACE === undefined ? "sit" : process.env.NAMESPACE;
        try{
            //initiate kube client
            this.kubeconfig = new KubeConfig();
            this.kubeconfig.loadFromCluster();
            this.backend = this.#setBackend(this.kubeconfig);
            this.client = this.#setClient(this.backend);
        }
        catch (error){
            if(config.environment !=="localhost"){
                logger.error({err:error}, "Failed initiated kube client");
            }
        }

    }
    #setClient(backend){
        return new Client({ backend, version: '1.13' });
    }

    #setBackend(kubeconfig){
        return new Request({ kubeconfig });
    }

    getIdentifier(){
        return this.currentPod;
    }

    getPosition(){
        if(!(this.client === undefined || this.client === null)){
            const currentPod = this.getIdentifier();
            let names = this.getPods();
            names.sort();
            let position = -1;
            names.forEach(function (value, i) {
                if(value == currentPod){
                    position = i;
                }
            });
            if(position == -1){
                throw new Error(`POD [${currentPod}] position not found`);
            }
            return position;
        }
        else{
            return -1;
        }

    }

    async getPods(active = true){
        if(!(this.client === undefined || this.client === null)){
            //Get all active pods by service name
            const pods = await this.client.api.v1.namespaces(this.namespace).pods.get({ qs: { labelSelector: `app=${process.env.SERVICE_NAME}` }});
            const currentPod = this.getIdentifier();
            if(currentPod === ""){
                throw new Error("Invalid POD name - Unset");
            }

            //Check one by one pod readiness
            if(active === true){
                return this.#checkPodReadiness(pods);
            }
            else{
                return this.#checkAllListingPod(pods);
            }
        }
        throw new Error("Kubernetes client not found");
    }

    #checkPodReadiness(pods){
        let names = [];
        for(const item of pods.body.items) {
            let readiness = false;
            //check pod and container readiness
            if (item.metadata.name === this.currentPod){
                readiness = true;
            }
            else if(item.status.phase === 'Running'){
                for(const condition of item.status.conditions){
                    if(condition.type === 'ContainersReady' && condition.status ==='True'){
                        readiness = true;
                    }
                }
            }
            if(readiness === true){
                names.push(item.metadata.name);
            }
            logger.info(`POD ${item.metadata.name} condition : ${JSON.stringify(item.status.conditions)}`);
        }
        return names;
    }

    #checkAllListingPod(pods){
        let unsortedNames =[];
        for(const item of pods.body.items) {
            unsortedNames.push(item.metadata.name);
            logger.info(`POD ${item.metadata.name} condition : ${JSON.stringify(item.status.conditions)}`);
        }
    }

    async getAssignedPartition(topic, maxTopicPartition){
        if(this.client === undefined || this.client === null){
            logger.info("Kubernetes client not found");
            let partitions = [];
            for (let i = 0; i < maxTopicPartition; i++) {
                partitions.push(i);
            }
            return partitions;
        }
        else{
            try{
                //Get all available pods by service name
                // const pods = await this.client.api.v1.namespaces(this.namespace).pods.get({ qs: { labelSelector: `app=${process.env.SERVICE_NAME}` }});
                // const currentPod = this.getIdentifier();
                // if(currentPod === ""){
                //     throw new Error("Invalid POD name - Unset");
                // }

                const currentPod = this.getIdentifier();

                //Get all ACTIVE PODS then Sort list of pods since we are not sure whether it is sorted
                let names = this.getPods();
                names.sort();

                //Get all available pods by service name
                let unsortedNames =this.getPods(false);
                logger.info(`SORTED POD NAME : ${JSON.stringify(names)}`);
                logger.info(`UNSORTED POD NAME : ${JSON.stringify(unsortedNames)}`);
                const totalPODs = names.length;

                //Get POD position
                let position = this.getPosition();
                logger.info(`POD ${currentPod} at position : ${position}`);

                let partitions = [];
                for (let i = 0; i < maxTopicPartition; i++) {
                    if(i % totalPODs == position){
                        partitions.push(i);
                    }
                }
                logger.info(`POD [${currentPod}]  Topic [${topic}] get partitions : [${partitions}]`);
                return partitions;
            }
            catch (error){
                logger.error({err:error}, error.message);
                return [];
            }
        }
    }
}

class Assignor{
    constructor() {
        throw new Error('Use Assignor.getInstance()');
    }
    static getInstance() {
        if (!Assignor.instance) {
            Assignor.instance = new PrivateAssignor();
        }
        return Assignor.instance;
    }
}

module.exports = Assignor;