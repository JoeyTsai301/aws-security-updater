module.exports = {
  "env": {
      "es6": true,
      "mocha": true,
      "node": true
  },
  "parserOptions": {
      "ecmaVersion": 8,
      "sourceType": "module",
  },
  "extends": "eslint:recommended",
  "rules": {
      "no-unused-vars": ["warn", { "vars": "all", "args": "after-used", "ignoreRestSiblings": false }],
      "indent": [
          "error",
          2,
          {"SwitchCase": 1}
      ],
      "no-console": "off",
      "linebreak-style": [
          "error",
          "unix"
      ],
      "quotes": [
          "error",
          "single"
      ],
      "semi": [
          "error",
          "always"
      ]
  }
};