/**
 * Created by leaf4monkey on 11/18/2017
 */
const {assert} = require('chai');
const loader = require('../');
const PATH = require('path');

const path = require.resolve('./mock');
const {dir} = PATH.parse(path);
const getExpected = (path, arr) => arr.map(name => require(`${path}/${name}`))
describe('loader()', () => {
    it('load all modules from a assigned directory.', () => {
        const path = `${dir}/m1`;
        assert.sameDeepOrderedMembers(loader(path), getExpected(path, ['m11', 'm12']));
    });

    it('throw an error when a empty directory is found', () => {
        const path = `${dir}/m2`;
        assert.throws(
            () => loader(path),
            `Cannot find module '${path}/m21'`
        );
    });

    it('filter files or directories by a string pattern', () => {
        const path = `${dir}/m2`;
        const filter = 'm22.js';
        assert.sameDeepOrderedMembers(loader(path, {filter}), getExpected(path, [filter]));
    });

    it('filter files or directories by a regex', () => {
        const path = `${dir}/m2`;
        const filter = /m22\.js/;
        const file = 'm22.js';
        assert.sameDeepOrderedMembers(loader(path, {filter}), getExpected(path, [file]));
    });

    it('filter by multi patterns', () => {
        const path = `${dir}/m1`;
        const filter = [/m12/, 'm11'];
        assert.sameDeepOrderedMembers(loader(path, {filter}), getExpected(path, ['m11', 'm12.js']));
    });

    it('filter by a function', () => {
        const path = `${dir}/m1`;
        const filter = file => 'm11' === file;
        assert.sameDeepOrderedMembers(loader(path, {filter}), getExpected(path, ['m11']));
    });

    it('load multi dirs', () => {
        const dirs = ['m1', 'm2'].map(p => `${dir}/${p}`);
        const filter = file => file !== 'm21';
        const expected = [getExpected(dirs[0], ['m11', 'm12']), getExpected(dirs[1], ['m22'])];
        assert.sameDeepOrderedMembers(loader(dirs, {filter}), expected);
    });

    it('load multi dirs from an object', () => {
        const dirs = {};
        ['m1', 'm2'].forEach(p => {
            dirs[p] = `${dir}/${p}`;
        });
        const filter = file => file !== 'm21';
        const expected = {m1: getExpected(dirs.m1, ['m11', 'm12']), m2: getExpected(dirs.m2, ['m22'])};
        assert.deepEqual(loader(dirs, {filter}), expected);
    });

    it('rewrite the module by `options.handler`', () => {
        const path = `${dir}/m1`;
        const filter = file => 'm11' === file;
        // assert.sameDeepOrderedMembers(loader(path, {filter}), getExpected(path, ['m11']));
        assert.deepEqual(loader(path, {filter, handler: () => 1}), [1])
    });
});
