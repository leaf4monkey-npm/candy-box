/**
 * Created by leaf4monkey on 11/18/2017
 */

module.exports = [
    {
        directories: [
            {
                name: 'dir1',
                parent: null
            }
        ],
        files: [
            {
                name: 'file13.js',
                parent: null
            },
            {
                name: 'file2.js',
                parent: null
            }
        ]
    },
    {
        directories: [
            {
                name: 'dir11',
                parent: 'dir1'
            },
            {
                name: 'dir12',
                parent: 'dir1'
            },
        ],
        files: [
            {
                name: 'file13.js',
                parent: 'dir1'
            },
        ]
    },
    {
        directories: [
            {
                name: 'dir111',
                parent: 'dir11'
            }
        ],
        files: []
    },
    {
        directories: [
            {
                name: 'dir1111',
                parent: 'dir111'
            }
        ],
        files: []
    },
    {
        directories: [],
        files: [
            {
                name: 'file11111.js',
                parent: 'dir1111'
            }
        ]
    }
];
