/**
 * Created by leaf4monkey on 12/18/2017
 */
const camelCase = require('lodash.camelcase');

const pushToSet = (arr, ...args) =>
    args.forEach(arg => {
        if (arr.indexOf(arg) < 0) {
            arr.push(arg);
        }
    });

const capitalize = str =>
    str.replace(/\b\w+\b/g, word => `${word.substring(0, 1).toUpperCase()}${word.substring(1)}`);

const getKey = (key, {camelCaseKey, capitalizeInitial}) => {
    if (camelCaseKey) {
        key = camelCase(key);
        if (capitalizeInitial) {
            key = capitalize(key);
        }
    }
    return key;
};

const isFn = fn => {
    return typeof fn === 'function';
};

const checkFn = fn => {
    const type = typeof fn;
    if (type !== 'function') {
        throw new TypeError(`Expect a function, got a(n) ${type}.`);
    }
};

const getConfigVal = (cfg, keys) => {
    if (!cfg) {
        return;
    }
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (cfg.hasOwnProperty(key)) {
            return cfg[key];
        }
    }
};

module.exports = {
    pushToSet,
    getKey,
    isFn,
    checkFn,
    getConfigVal
};
