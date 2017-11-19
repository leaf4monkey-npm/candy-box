/**
 * Created by leaf4monkey on 11/18/2017
 */
const finder = require('../');
const _mockData = require('./mock');
const {assert} = require('chai');
const PATH = require('path');
const _ = require('lodash');

const path = require.resolve('./mock');
const dir = `${PATH.parse(path).dir}/m`;

describe('finder()', () => {
    let result;
    let mockData;
    const handler = ({fullPath, filename, isDirectory, layer, parent}) => {
        result[layer] = result[layer] || {directories: [], files: []};
        const desc = {name: filename, parent};
        const name = isDirectory ? 'directories' : 'files';
        result[layer][name].push(desc);
    };

    beforeEach(() => {
        result = [];
        mockData = JSON.parse(JSON.stringify(_mockData));
    });

    it('walk the directory in 1st layer on default', () => {
        finder(dir, {handler});
        assert.deepEqual(result, mockData.slice(0, 1));
    });

    it('walk the directory recursively', () => {
        finder(dir, {handler, recursive: true});
        assert.sameDeepOrderedMembers(result, mockData);
    });

    it('walk the directory recursively in assigned depth', () => {
        const depth = 3;
        finder(dir, {handler, recursive: true, depth});
        assert.sameDeepOrderedMembers(result, mockData.slice(0, depth));
    });

    it('filter by a string pattern', () => {
        finder(dir, {handler, filter: 'dir1', recursive: true});
        const expected = mockData.slice(0, 1);
        expected[0].files = [];
        assert.sameDeepOrderedMembers(result, expected);
    });

    it('filter by a regex pattern', () => {
        finder(dir, {handler, filter: /dir/, recursive: true});
        const expected = mockData.slice(0, -1).map(d => _.assign(d, {files: []}));
        assert.sameDeepOrderedMembers(result, expected);
    });

    it('filter by multi patterns', () => {
        const file = 'file13.js';
        const reg = /r1|e11/;
        const filter = [file, reg];
        finder(dir, {handler, filter, recursive: true});
        let expected = mockData.map(data => {
            const map = {};
            ['directories', 'files'].forEach(key => {
                data[key] = data[key].filter(({name}) => file === name || reg.test(name));
                if (!_.isEmpty(data[key])) {
                    map[key] = data[key];
                }
            });
            if (!_.isEmpty(map)) {
                ['directories', 'files'].forEach(key => {
                    map[key] = map[key] || [];
                });
                return map;
            }
        });

        expected = _.compact(expected);
        assert.sameDeepOrderedMembers(result, expected);
    });

    it('filter by a function', () => {
        finder(dir, {handler, filter: file => file !== 'file11111.js', recursive: true});
        assert.sameDeepOrderedMembers(result, mockData.slice(0, -1));
    });
});
