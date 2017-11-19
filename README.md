# Candy-Box

Manage your modules classify, and provide Dependency Injection for them.

## Features

- Auto load the modules in the directories you assign.

- Provide DI for the registered modules.

- Prevent the registered modules to be retrieved directly.

## Get Started

1. Install `candy-box`:

    ```bash
    $ npm i candy-box
    ```

2. Write your configs in a `candyboxrc.json`:

    candyboxrc.json:

    ```json
    {
      "injectSelf": true, // Inject itself to the modules of a provided context, default `true`.
      "camelCaseKey": true, // Change name of module and context to be "camelCase", default `true`.
      "capitalizeInitial": { // Capitalize the initial letter of a name, only active when `camelCaseKey` is true, default `true`.
        "module": true, // Active on module name, default `true`.
        "contextKey": true // Active on context name, default `true`.
      },
      "oneWayDependency": true, // One-way dependencies, default `true`.
      "context": {
        "./path/to/dir1": {
          "injectSelf": false, // Rewrite `config.injectSelf` locally.
          "camelCaseKey": true, // Rewrite `config.camelCaseKey` locally.
          "capitalizeInitial": true, // Rewrite `config.capitalizeInitial` locally.
          "name": "DAOs" // Rewrite the context name.
          // "dependencies": ["Dir2"], // Illegal dependencies.
        },
        "./path/to/dir2": {
          "dependencies": ["Dir1"],
          "skip": ["Module2"], // Skip loading the assigned modules.
          "childrenConfigs": {
            "User": {
              "dependencies": ["Dir1.Module1"],
              "mergeDependencies": false
            }
          }
        }
      }
    }
    ```

3. Define your modules in the directories you assigned in configs, for example:

    dir1/module1.js:

    ```js
    module.exports = ctx => {
        let Dir1;
        ctx.onInitialized(() => {
            Dir1 = ctx.Dir1; // Yes, you can get the modules under the "dir1".
        });
        return {
            fn () {
                // your bussiness code.
                return 'dir1/module1';
            }
        };
    };
    ```

    dir2/module1.js:

    ```js
    // const Dir1Module1 = require('path/to/dir1/module1'); // Cannot get the correct module.

    module.exports = ctx => {
        let Dir1;
        ctx.onInitialized(() => {
            Dir1 = ctx.Dir1;
        });
        return {
            fn () {
                // your bussiness code.
                console.log(Dir1.Module1.fn()); // dir1/module1
            }
        };
    };
    ```

4. Load your configs on starting up.

    startup.js
    ```js
    const loader = require('candy-box');
    const path = require('path');

    loader(path.resolve('.')); // Assume you `candyboxrc.json` file is in the current path.
    ```