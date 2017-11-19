/**
 * Created by leaf4monkey on 11/18/2017
 */

const {ls} = require('../directory');
const {assert} = require('chai');
const PATH = require('path');
const fs = require('fs');

const path = require.resolve('./mock');
const {dir} = PATH.parse(path);
describe('Directory', () => {
    describe('.ls()', () => {
        it('list all files or directories in assigned directory', () => {
            assert.deepEqual(ls(dir), fs.readdirSync(dir));
        });

        it('throw an error when the assigned argument is a path to a file.', () => {
            assert.throws(() => ls(path), `Unexpected file of path '${path}'`)
        });

        it('can be filtered by a function', () => {
            const filter = file => file !== 'index.js';
            assert.deepEqual(
                ls(dir, filter),
                fs.readdirSync(dir).filter(filter)
            );
        });
    });
});