/**
 * Created by leaf4monkey on 11/18/2017
 */

const traverser = require('dir-traverse');

const load = (dir, options) => {
    const modules = [];
    const handler = (attrs) => {
        const {fullPath} = attrs;
        let mo = require(fullPath);
        if (options.handler) {
            mo = options.handler(attrs, mo) || mo;
        }
        modules.push(mo);
    };
    traverser(dir, {filter: options.filter, handler});
    return modules;
};

/**
 * @param dirs
 * @param options {?object=}
 * @param options.filter {?string|regexp|Array.<string|regexp>|object=}
 * @param options.handler
 * @returns {*}
 */
const loader = (dirs, {filter, handler} = {}) => {
    const fn = dir => load(dir, {filter, handler});
    if (Array.isArray(dirs)) {
        return dirs.map(fn);
    }
    const type = typeof dirs;
    if (type === 'string') {
        return fn(dirs);
    }
    if (dirs) {
        const map = {};
        Object.keys(dirs).forEach(name => {
            const dir = dirs[name];
            map[name] = fn(dir);
        });
        return map;
    }

    throw new TypeError(`Expect \`dirs\` to be a string, an array of string or an object, got a(n) ${type}.`);
};

module.exports = loader;
