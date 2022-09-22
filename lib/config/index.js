const yamlParser = require('yaml');
const yamlConfig = require('node-yaml-config');
const Consul = require('consul');
const utils = require("../utils");

const localConfig = yamlConfig.read("app.yaml");
const consul = new Consul({
    host:localConfig.application.consul.host,
    port:localConfig.application.consul.port,
    promisify: true
});


const traverseObjectThenReplace = (objConsul, objLocal, listKey=[]) => {
    if (utils.isObject(objConsul)) {
        const keys = Object.keys(objConsul);
        for (const val of keys) {
            listKey.push(val);
            traverseObjectThenReplace(objConsul[val], objLocal, listKey);
            listKey.pop();
        }
    }
    else{
        let mergeObj = objLocal;
        for (const keyName of listKey) {
            if(mergeObj.hasOwnProperty(keyName)){
                if(utils.isObject(mergeObj[keyName])){
                    mergeObj = mergeObj[keyName];
                }
                else{
                    mergeObj[keyName] = objConsul;
                }
            }
        }
    }
}

class AgentConfiguration{
    #localConfig;
    #consulAgent;
    #mergeConfig;
    constructor(){
        this.#localConfig = localConfig;
        this.#consulAgent = consul;
        this.#mergeConfig = {...localConfig}
    }

    async loadAndReplaceConfig(){
        if(localConfig.environment !== "localhost"){
            try{
                const data = await this.#consulAgent.kv.get(localConfig.service);
                if(data !== undefined){
                    const parsedData = yamlParser.parse(data.Value);
                    traverseObjectThenReplace(parsedData, this.#mergeConfig);
                    return this.#mergeConfig
                }
            }
            catch (error){
                throw new Error("Failed get data consul");
            }
        }
        else{
            return this.#mergeConfig
        }
    }

    get(){
        return this.#mergeConfig
    }

    getLocalConfig(){
        return this.#localConfig
    }
}

const config = new AgentConfiguration();
module.exports = config;