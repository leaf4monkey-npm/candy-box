/**
 * Created by leaf4monkey on 04/03/2018
 */
const PATH = require('path');
const Candy = require('./candy');
const omit = require('lodash.omit');
const loader = require('gnat-dir-loader');
const {
    pushToSet,
    getKey,
    getConfigVal,
} = require('./utils');

class Trellis {
    constructor (box, path, config) {
        this.box = box;
        this.root = box.root;
        this.path = path;
        this.dir = PATH.join(this.root, path);
        this.config = this.parseConfig(config);
        const candyKeys = ['childrenConfigs', 'candies'];
        this.candyConfigBase = getConfigVal(this.config, candyKeys);
        this.config = omit(this.config, candyKeys);
        this.name = this.config.name;
        this.tree = {};

        this.candies = {};
        this.candyNames = [];
    }

    getLv () {
        return this.box.getTrellisLv(this.name);
    }

    parseConfig (config) {
        const cfg = Object.assign({dir: this.dir}, this.box.config, config);
        if (cfg.capitalizeInitial) {
            if (typeof cfg.capitalizeInitial === 'boolean') {
                cfg.capitalizeInitial = {
                    module: true,
                    contextKey: true
                };
            }
        } else {
            cfg.capitalizeInitial = {};
        }
        cfg.name = cfg.name || getKey(
            this.path,
            {
                camelCaseKey: cfg.camelCaseKey,
                capitalizeInitial: getConfigVal(cfg.capitalizeInitial, ['contextKey', 'trellis']),
            }
        );
        cfg.dependencies = cfg.dependencies || [];
        if (cfg.injectSelf) {
            pushToSet(cfg.dependencies, cfg.name);
        }
        return Object.assign({childrenConfigs: {}, skip: []}, cfg);
    }

    fillCandies () {
        const {filter} = this.config;

        const opts = {
            filter,
            handler: ({name}, candyExports) =>
                this._putCandy(name, candyExports)
        };
        loader(this.dir, opts);
    }

    injectJuice () {
        this.candyNames.forEach(name => {
            const candy = this.candies[name];
            candy.injectJuice();
            this.tree[name] = candy.obj;
        });
    }

    getCandy (name) {
        return this.candies[name];
    }

    _putCandy (name, candyExports) {
        const {
            camelCaseKey,
            capitalizeInitial,
            skip,
        } = this.config;
        const cfg = {
            mergeDependencies: false,
            camelCaseKey,
            capitalizeInitial: getConfigVal(capitalizeInitial, ['module', 'candy']),
        };
        name = getKey(name, cfg);
        Object.assign(
            cfg,
            {name},
            this.config,
            this.candyConfigBase[name]
        );
        if (skip.length && skip.indexOf(name) >= 0) {
            return;
        }
        if (!candyExports || candyExports.skip) {
            return;
        }

        this.candies[name] = new Candy(this, cfg, candyExports);
        this.candyNames.push(name);
    }
}

module.exports = Trellis;
