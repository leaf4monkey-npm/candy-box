/**
 * Created by leaf4monkey on 11/18/2017
 */
const Box = require('./box');

const box = root => {
    const {tree} = new Box(root);
    return tree;
};

box.Box = Box;

module.exports = box;
