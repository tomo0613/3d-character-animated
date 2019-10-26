const DISABLED = 0;
const WARNING = 1;
const ERROR = 2;

module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'airbnb-base',
        'plugin:@typescript-eslint/recommended',
    ],
    env: {
        'node': true,
        'browser': true,
    },
    rules: {
        'indent': [ERROR, 4, {SwitchCase: 1}],
        'max-len': [ERROR, 120],
        'import/prefer-default-export': DISABLED,
        'import/no-unresolved': DISABLED,
        // 'import/extensions': [ERROR, 'always'],
        'no-multi-spaces': WARNING,
        'no-plusplus': DISABLED,
        'no-use-before-define': [ERROR, 'nofunc'],
        '@typescript-eslint/no-use-before-define': [ERROR, 'nofunc'],
        'object-curly-spacing': DISABLED,
        'object-curly-newline': DISABLED,
        '@typescript-eslint/explicit-function-return-type': DISABLED,
        'lines-between-class-members': [WARNING, 'always', {"exceptAfterSingleLine": true}],
        'no-underscore-dangle': DISABLED,
        '@typescript-eslint/explicit-member-accessibility': DISABLED,
        'linebreak-style': DISABLED,
    },
};
