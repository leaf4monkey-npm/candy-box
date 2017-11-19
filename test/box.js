/**
 * Created by leaf4monkey on 11/18/2017
 */
const box = require('../');
const PATH = require('path');
const {assert} = require('chai');
const get = require('lodash.get');

const mockPath = require.resolve('./mock');
const {dir: root} = PATH.parse(mockPath);
const app1 = PATH.join(root, 'app1');
describe('box()', () => {
    let serviceKey;
    let daoKey;
    let userKey;
    let messageKey;
    let baseConfig;
    const getBaseConfig = (data) => Object.assign(
        {
            baseDir: app1,
            context: {
                dao: {},
                services: {}
            }
        },
        data
    );

    beforeEach(() => {
        serviceKey = 'Services';
        daoKey = 'DAOs';
        userKey = 'User';
        messageKey = 'Message';
        baseConfig = {
            baseDir: app1,
            context: {
                dao: {
                    name: daoKey
                },
                services: {}
            }
        };
    });

    const getMaps = resultMap => {
        const dependenciesMap = {};
        const moduleMap = {};
        [serviceKey, daoKey].forEach(ctx =>
            [userKey, messageKey].forEach(name => {
                const key = `${ctx}.${name}`;
                const mod = get(resultMap, key);
                const fn = get(mod, `fn`);
                assert.typeOf(fn, 'function');
                dependenciesMap[key] = fn();
                moduleMap[key] = mod;
            })
        );
        return {dependenciesMap, moduleMap};
    };

    const moduleAsserts = (dependenciesMap, moduleMap) =>
        [serviceKey, daoKey].forEach(ctxKey =>
            [userKey, messageKey].forEach(name => {
                const key = `${ctxKey}.${name}`;
                const deps = dependenciesMap[key];
                assert.equal(deps.initialized, true);
                let c = 0;
                Object.keys(deps).forEach(k => {
                    const mo = deps[k];
                    Object.keys(mo)
                        .forEach(kk => {
                            if (!kk) {
                                return;
                            }
                            c++;
                            assert.deepEqual(mo[kk], get(moduleMap, `${k}.${kk}`));
                        });
                });
                assert.isAbove(c, 0);
            })
        );

    const nonDepsAsserts = (dependenciesMap) =>
        [serviceKey, daoKey].forEach(ctxKey =>
            [userKey, messageKey].forEach(name => {
                const key = `${ctxKey}.${name}`;
                const deps = dependenciesMap[key];
                assert.notProperty(deps, daoKey);
                assert.notProperty(deps, serviceKey);
            })
        );

    const onlySelfInjectedAsserts = (dependenciesMap) =>
        [serviceKey, daoKey].forEach(ctxKey =>
            [userKey, messageKey].forEach(name => {
                const key = `${ctxKey}.${name}`;
                const deps = dependenciesMap[key];
                const otherKey = ctxKey === serviceKey ? daoKey : serviceKey;
                assert.notProperty(deps, otherKey);
                assert.property(deps, ctxKey);
            })
        );

    const oneWayDepAsserts = dependenciesMap =>
        [daoKey].forEach(ctxKey =>
            [userKey, messageKey].forEach(name => {
                const key = `${ctxKey}.${name}`;
                const deps = dependenciesMap[key];
                assert.notProperty(deps, serviceKey);
            })
        );

    const notOneWayDepAsserts = dependenciesMap =>
        [daoKey].forEach(ctxKey =>
            [userKey, messageKey].forEach(name => {
                const key = `${ctxKey}.${name}`;
                const deps = dependenciesMap[key];
                assert.property(deps, serviceKey);
            })
        );

    it('build a series of dependencies injected modules', () => {
        const resultMap = box(PATH.join(app1, 'candyboxrc.json'));
        const {dependenciesMap, moduleMap} = getMaps(resultMap);
        moduleAsserts(dependenciesMap, moduleMap);
        notOneWayDepAsserts(dependenciesMap);

        assert.deepEqual(get(dependenciesMap['Services.User'], {DAOs: {User: get(moduleMap, 'DAOs.User')}}));
    });

    it('with default configs', () => {
        daoKey = 'Dao';
        const resultMap = box(getBaseConfig());
        const {dependenciesMap, moduleMap} = getMaps(resultMap);
        moduleAsserts(dependenciesMap, moduleMap);
        onlySelfInjectedAsserts(dependenciesMap);
    });

    it('with `config.injectSelf` is false', () => {
        const resultMap = box(getBaseConfig({
            injectSelf: false,
            context: {
                dao: {
                    name: daoKey
                },
                services: {}
            }
        }));
        const {dependenciesMap} = getMaps(resultMap);
        nonDepsAsserts(dependenciesMap);
    });

    it('with `config.capitalizeInitial.module` is false', () => {
        userKey = 'user';
        messageKey = 'message';
        const resultMap = box(getBaseConfig({
            injectSelf: false,
            capitalizeInitial: {
                module: false,
                contextKey: true
            },
            context: {
                dao: {name: daoKey},
                services: {}
            }
        }));
        const {dependenciesMap} = getMaps(resultMap);
        nonDepsAsserts(dependenciesMap);
    });

    it('with `config.capitalizeInitial.contextKey` is false', () => {
        daoKey = 'dao';
        serviceKey = 'services';
        const resultMap = box(getBaseConfig({
            injectSelf: false,
            capitalizeInitial: {
                module: true,
                contextKey: false
            },
            context: {
                dao: {},
                services: {}
            }
        }));
        const {dependenciesMap} = getMaps(resultMap);
        nonDepsAsserts(dependenciesMap);
    });

    it('with `config.camelCaseKey` is false', () => {
        daoKey = 'dao';
        serviceKey = 'services';
        userKey = 'user';
        messageKey = 'message';
        const resultMap = box(getBaseConfig({
            injectSelf: false,
            capitalizeInitial: true,
            camelCaseKey: false,
            context: {
                dao: {},
                services: {}
            }
        }));
        const {dependenciesMap} = getMaps(resultMap);
        nonDepsAsserts(dependenciesMap);
    });

    it('`one-way dependencies` mode', () => {
        assert.throws(
            () => box(PATH.join(app1, 'one-way-deps.json')),
            '`one-way dependency` is turned on, `Services` cannot be a dependencies to `DAOs`'
        );
    });

    it('with `config.context.${dir}.skip` set', () => {
        const resultMap = box(getBaseConfig({
            capitalizeInitial: true,
            context: {
                dao: {name: daoKey},
                services: {skip: ['User']}
            }
        }));
        assert.notProperty(resultMap.Services, userKey);
        assert.property(resultMap.Services, messageKey);
    });
});
