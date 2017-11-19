/**
 * Created on 2017/6/9.
 * @author joc (Chen Wen)
 */
const fs = require('fs');
const {ls} = require('./directory');
const PATH = require('path');

const getStat = path => fs.statSync(path);
const reachMaxLayer = (depth, layer) => depth > 0 && depth <= layer + 1;

const checkFunction = (name, fn) => {
    const type = typeof fn;
    if (type !== 'function') {
        throw new TypeError(`expect \`${name}\` to be a function, got a(n) ${type}.`);
    }
};

const getFilter = filter => {
    if (!filter) {
        return;
    }

    let type = typeof filter;
    if (type === 'function') {
        return filter;
    }
    if (type === 'string') {
        return file => file === filter;
    }
    if (filter instanceof RegExp) {
        return file => filter.test(file);
    }
    if (filter instanceof Array) {
        const filterArr = filter.map(getFilter);
        return file => filterArr.some(f => f(file));
    }

    throw new TypeError(
        `Expect \`filter\` to be a function, RegExp type, string or an Array of string, got a(n) ${type}.`
    );
};

/**
 * To search the names of files or directories in a assigned directory.
 * @param dir {string} the full dir path
 * @param options
 * @param options.handler {!function} the handler function for each file or directory.
 * @param options.filter {?string|RegExp|function=} the filter pattern or function.
 * @param options.recursive {?boolean=} decide whether walking the directory recursively or not.
 */
const finder = (dir, options = {}) => {
    const {handler, filter, recursive, depth = 0} = options;
    const filterFn = getFilter(filter);

    const fn = (dir, options, layer, parent) => {
        checkFunction('handler', handler);

        ls(dir, filterFn).forEach(filename => {
            const fullPath = PATH.join(dir, filename);
            const stat = getStat(fullPath);
            const isFile = stat.isFile();
            const isDirectory = stat.isDirectory();
            let name = filename;
            let ext;
            if (isFile) {
                ({ext, name} = PATH.parse(filename));
            }
            const attributes = {
                dir,
                parent,
                name,
                ext,
                filename,
                fullPath,
                isFile,
                isDirectory,
                layer
            };

            handler && handler(attributes);

            if (isDirectory && recursive && !reachMaxLayer(depth, layer)) {
                fn(fullPath, options, layer + 1, filename);
            }
        });
    };

    fn(dir, options, 0, null);
};

module.exports = finder;
