const {v4 : uuidv4} = require('uuid');

class UUIDGenerator {
    new(){
        return uuidv4();
    }
}

const uuidGen = new UUIDGenerator();

module.exports = uuidGen