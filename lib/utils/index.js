const isObject = (value) => {
    return !!(value && typeof value === "object" && !Array.isArray(value));
};

const delay = (value)=>{
    return new Promise(r => setTimeout(r, value));
}

module.exports = {
    isObject,
    delay
};