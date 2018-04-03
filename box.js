/**
 * Created by leaf4monkey on 04/03/2018
 */
const omit = require('lodash.omit');
const Trellis = require('./trellis');
const get = require('lodash.get');
const PATH = require('path');
const {checkFn, getConfigVal} = require('./utils');

const checkConfig = ({context}) => {
    if (!context) {
        throw new TypeError(`Expect \`context\` to be an object.`);
    }
};

const parseConfig = config => {
    if (typeof config === 'string') {
        if (!/\.json$/.test(config)) {
            config = PATH.join(config, 'candyboxrc.json');
        }
        const {dir} = PATH.parse(config);
        config = require(config);
        config.baseDir = config.baseDir || dir;
    }
    config = Object.assign({
        injectSelf: true,
        oneWayDependency: true,
        capitalizeInitial: true,
        camelCaseKey: true,
        setQuota: true,
    }, config);
    config.context = config.context || config.trellises;
    config.trellises = config.context;

    checkConfig(config);

    return config;
};

const treeSymbol = Symbol('tree');
const loadDoneSymbol = Symbol('loadDone');
const onInitializedCallbacksSymbol = Symbol('onInitializedCallbacks');

class Box {
    constructor (root) {
        const config = parseConfig(root);
        const trellisKeys = ['context', 'trellises'];
        const trellisesCfg = getConfigVal(config, trellisKeys);
        this.config = omit(config, trellisKeys);
        this.root = config.baseDir;
        this.trellisesPaths = Object.keys(trellisesCfg);
        this.trellises = {};
        this.trellisesNames = [];
        this[loadDoneSymbol] = false;
        this[treeSymbol] = {};
        this[onInitializedCallbacksSymbol] = [];
        this._fillTrellises(trellisesCfg);
    }

    get tree () {
        return this[treeSymbol];
    }

    get initialized () {
        return this[loadDoneSymbol];
    }

    getTreeByPath (path) {
        return get(this.tree, path);
    }

    getTrellisLv (trellis) {
        return this.trellisesNames.indexOf(trellis);
    }

    getTrellis (name) {
        return this.trellises[name];
    }

    onInitialized (cb) {
        checkFn(cb);
        this[onInitializedCallbacksSymbol].push(cb);
    }

    _initializedDone () {
        this[loadDoneSymbol] = true;
        this[onInitializedCallbacksSymbol].forEach(cb => cb());
    }

    _fillTrellises (cfg) {
        this.trellisesPaths.forEach(path => this._tagTrellis(new Trellis(this, path, cfg[path])));
        this.trellisesNames.forEach(name => this.getTrellis(name).fillCandies());
        this.trellisesNames.forEach(name => this.getTrellis(name).initDeps());
        this.trellisesNames.forEach(name => this.getTrellis(name).injectJuice());
        this._initializedDone();
    }

    _tagTrellis (trellis) {
        const {name} = trellis;
        this.trellises[name] = trellis;
        this.trellisesNames.push(name);
        this[treeSymbol][name] = trellis.tree;
    }
}

module.exports = Box;
