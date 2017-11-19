/**
 * Created by leaf4monkey on 11/18/2017
 */
const PATH = require('path');
const loader = require('gnat-dir-loader');
const camelCase = require('lodash.camelcase');
const get = require('lodash.get');

const pushToSet = (arr, ...args) =>
    args.forEach(arg => {
        if (arr.indexOf(arg) < 0) {
            arr.push(arg);
        }
    });

const parseConfig = config => {
    if (typeof config === 'string') {
        if (!/\.json$/.test(config)) {
            config = PATH.join(config, 'candyboxrc.json');
        }
        const {dir} = PATH.parse(config);
        config = require(config);
        config.baseDir = config.baseDir || dir;
    }
    return Object.assign({
        injectSelf: true,
        oneWayDependency: true,
        capitalizeInitial: true,
        camelCaseKey: true
    }, config);
};

const capitalize = str =>
    str.replace(/\b\w+\b/g, word => `${word.substring(0, 1).toUpperCase()}${word.substring(1)}`);

const checkConfig = ({context}) => {
    if (!context) {
        throw new TypeError(`Expect \`context\` to be an object.`);
    }
};

const getKey = (key, {camelCaseKey, capitalizeInitial}) => {
    if (camelCaseKey) {
        key = camelCase(key);
        if (capitalizeInitial) {
            key = capitalize(key);
        }
    }
    return key;
};

const checkFn = fn => {
    const type = typeof fn;
    if (type !== 'function') {
        throw new TypeError(`Expect a function, got a(n) ${type}.`);
    }
};

const box = root => {
    const onInitializedCallbacks = [];
    let isInitialized = false;
    const depArr = [];
    const onInitialized = fn => {
        checkFn(fn);
        onInitializedCallbacks.push(fn);
    };
    const config = parseConfig(root);
    root = config.baseDir;
    checkConfig(config);
    const {context, oneWayDependency} = config;
    const dirs = Object.keys(context);
    if (!dirs.length) {
        return;
    }

    const parseCtxConfig = (key) => {
        const cfg = Object.assign({}, config, context[key]);
        if (cfg.capitalizeInitial) {
            if (typeof cfg.capitalizeInitial === 'boolean') {
                cfg.capitalizeInitial = Object.assign({
                    module: true,
                    contextKey: true
                });
            }
        } else {
            cfg.capitalizeInitial = {};
        }
        cfg.name = cfg.name || getKey(
            key,
            {camelCaseKey: cfg.camelCaseKey, capitalizeInitial: cfg.capitalizeInitial.contextKey}
        );
        cfg.dependencies = cfg.dependencies || [];
        if (cfg.injectSelf) {
            pushToSet(cfg.dependencies, cfg.name);
        }
        return Object.assign({childrenConfigs: {}}, cfg);
    };

    const resultMap = {};
    const ctxMap = {};
    const dependenciesMap = {};
    const configMap = {};
    const sortedCtxNames = [];

    dirs.forEach(path => {
        const dir = PATH.join(root, path);
        const ctxCfg = parseCtxConfig(path);
        ctxCfg.dir = dir;
        const {
            name,
            dependencies,
            camelCaseKey,
            filter,
            capitalizeInitial: {module: capitalizeInitial}
        } = ctxCfg;
        sortedCtxNames.push(name);
        if (resultMap[name]) {
            throw new Error(`Another context named "${name}" exists.`);
        }
        configMap[name] = ctxCfg;
        resultMap[name] = {};
        ctxMap[name] = {};
        dependenciesMap[name] = {};
        const fns = resultMap[name];
        const dep = dependenciesMap[name];

        const handler = ({name}, fn) => {
            name = getKey(name, {camelCaseKey, capitalizeInitial});
            const cfg = Object.assign({mergeDependencies: false}, ctxCfg.childrenConfigs[name]);
            if (fn && !fn.skip) {
                fns[name] = fn;

                let arr;
                if (cfg.mergeDependencies) {
                    arr = dependencies.slice(0);
                    cfg.dependencies &&
                    cfg.dependencies.length &&
                    pushToSet(arr, ...cfg.dependencies);
                } else {
                    arr = cfg.dependencies || dependencies || [];
                }
                dep[name] = arr;
            }
        };

        loader(dir, {
            filter,
            handler
        });
    });

    const getDependenciesTree = (ctxKey, dependencies) => {
        const tree = {
            get initialized () {
                return isInitialized;
            }
        };
        dependencies.forEach(dependency => {
            const paths = dependency.split('.');
            if (oneWayDependency) {
                const dependencyLv = sortedCtxNames.indexOf(paths[0]);
                const ctxLv = sortedCtxNames.indexOf(ctxKey);
                if (dependencyLv > ctxLv) {
                    throw new Error(
                        `\`one-way dependency\` is turned on, \`${paths[0]}\` cannot be a dependencies to \`${ctxKey}\``
                    );
                }
            }

            let obj = tree;
            paths.slice(0, -1).forEach((path) => {
                obj[path] = {};
                obj = obj[path];
            });
            Object.assign(obj, {
                get [paths[paths.length - 1]] () {
                    return get(ctxMap, dependency);
                }
            });
        });
        return tree;
    };

    Object.keys(resultMap).forEach(ctxKey => {
        const map = resultMap[ctxKey];
        const ctx = ctxMap[ctxKey];
        const dep = dependenciesMap[ctxKey];
        Object.keys(map).forEach(moduleName => {
            const fn = map[moduleName];
            const dependencies = dep[moduleName] || [];
            const deps = getDependenciesTree(ctxKey, dependencies);
            deps.onInitialized = onInitialized;
            const isFn = typeof fn === 'function';
            depArr.push(deps);

            map[moduleName] = isFn ? fn(deps) : fn;
            ctx[moduleName] = map[moduleName];
        });
    });

    isInitialized = true;
    onInitializedCallbacks.forEach(cb => cb());

    return resultMap;
};

module.exports = box;
