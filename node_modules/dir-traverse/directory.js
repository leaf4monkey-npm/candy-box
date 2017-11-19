/**
 * Created by leaf4monkey on 11/18/2017
 */
const fs = require('fs');

const checkDir = path => {
    const stat = fs.statSync(path);
    if (!stat.isDirectory()) {
        throw new Error(`Unexpected file of path '${path}'`);
    }
};

/**
 *
 * @param path
 * @param filter
 * @returns {Array.<string>}
 */
const ls = (path, filter) => {
    checkDir(path);

    let arr = fs.readdirSync(path);
    if (filter) {
        arr = arr.filter(filter);
    }
    return arr;
};

module.exports = {
    ls
};
