/**
 * Created by leaf4monkey on 04/03/2018
 */
const {isFn, pushToSet} = require('./utils');

const reachMaxLayer = (depth, layer) => depth > 0 && depth <= layer + 1;

const traverseObj = (obj, cb, opts = {}, layer = 0) => {
    if (!obj) {
        return;
    }

    if (layer && !opts.recursive) {
        return;
    }

    if (reachMaxLayer(opts.depth, layer)) {
        return;
    }

    const keys = Object.keys(obj);
    if (!keys.length) {
        return;
    }

    keys.forEach(key => {
        const fn = obj[key];
        if (isFn(fn)) {
            return cb(obj, key, fn);
        }

        if (fn) {
            traverseObj(fn, cb, opts, layer);
        }
    });
};

class Candy {
    constructor (trellis, cfg, fn) {
        this.name = cfg.name;
        this.box = trellis.box;
        this.trellis = trellis;
        this._initializeFn = fn;
        this.config = cfg;
        this._setDependencies();
        this._dependenciesTree = this._initDeps();
    }

    _bindCtx () {
        let {bindCtx} = this.config;
        if (!bindCtx) {
            return;
        }

        if (typeof bindCtx === 'boolean') {
            bindCtx = {
                recursive: true
            };
        }

        const cb = (parent, key, fn) => {
            parent[key] = fn.bind(this._dependenciesTree);
        };

        traverseObj(this.obj, cb, bindCtx);
    }

    _setDependencies () {
        let arr;
        let cfg = this.config;
        let {dependencies} = this.trellis.config;
        dependencies = dependencies || [];
        if (cfg.mergeDependencies) {
            arr = dependencies.slice(0);
            cfg.dependencies &&
            cfg.dependencies.length &&
            pushToSet(arr, ...cfg.dependencies);
        } else {
            arr = cfg.dependencies || dependencies;
        }
        if (cfg.injectSelf) {
            pushToSet(arr, this.trellis.name);
        }
        cfg.dependencies = arr;
    }

    _oneWayDepCheck (dep) {
        const {oneWayDependency} = this.config;
        const {name} = this.trellis;
        if (oneWayDependency) {
            const dependencyLv = this.box.getTrellisLv(dep);
            const ctxLv = this.trellis.getLv();
            if (dependencyLv > ctxLv) {
                throw new Error(
                    `\`one-way dependency\` is turned on, \`${dep}\` cannot be a dependencies to \`${name}\``
                );
            }
        }
    }

    _initDeps () {
        const {box} = this;
        const tree = {
            get initialized () {
                return box.initialized;
            },
            onInitialized: (cb) =>
                this.onInitialized(cb)
        };
        const {dependencies} = this.config;
        dependencies.forEach(dependency => {
            const paths = dependency.split('.');
            this._oneWayDepCheck(paths[0]);

            let obj = tree;
            const pathByLayer = [];

            paths.forEach(path => {
                pathByLayer.push(path);
                const retrieveKey = pathByLayer.join('.');
                Object.assign(obj, {
                    get [path] () {
                        return box.getTreeByPath(retrieveKey);
                    }
                });
                obj = obj[path];
            });
        });

        return tree;
    }

    injectJuice () {
        if (!isFn(this._initializeFn)) {
            this.obj = this._initializeFn;
            return;
        }
        this.obj = this._initializeFn(this._dependenciesTree);
        this._bindCtx();
    }

    onInitialized (cb) {
        return this.box.onInitialized(cb);
    }
}

module.exports = Candy;
