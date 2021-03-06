module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    rules: {
        // losening default rules
        "no-undef": "off",
        "@typescript-eslint/ban-ts-ignore": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-unused-vars": ["warn", {args: "none"}],
        "@typescript-eslint/no-namespace": ["error", {allowDeclarations: true}],
        "@typescript-eslint/no-non-null-assertion": "off",
        "no-constant-condition": ["warn", {checkLoops: false}],

        // stricter linting rules:
        "@typescript-eslint/no-shadow": ["warn", {allow: ["urlr"]}],
        "eqeqeq": ["warn", "always", {null: "never"}],

        // style rules:
        // "indent": ["warn", 4, {'SwitchCase': 1, 'offsetTernaryExpressions': true, 'ignoredNodes': ["ConditionalExpression"]}],
        "@typescript-eslint/brace-style": ["warn", "1tbs", {allowSingleLine: true}],
        "@typescript-eslint/semi": ["warn", "always", {omitLastInOneLineBlock: true}],
    },
    overrides: [{
        files: ["*.js", "*.jsx"],
        rules: {
            "@typescript-eslint/no-var-requires": 0,
            "@typescript-eslint/naming-convention": 0,
        },
    }, {
        files: ["*.ts", "*.tsx"],
        parserOptions: {
            project: "./tsconfig.json",
        },
        extends: [
            "plugin:@typescript-eslint/recommended-requiring-type-checking",
        ],
        rules: {
            // looser rules:
            "@typescript-eslint/restrict-plus-operands": 0, // "" + number is used frequently
            "@typescript-eslint/require-await": 0, // ?? do you want me to function() {return new Promise(r => r())}??
            "@typescript-eslint/prefer-regexp-exec": 0, // imo more confusing
            "@typescript-eslint/no-misused-promises": 0, // every single funcution call goes through a promise and most of them (probably) can't fail

            // stricter linting rules:
            "@typescript-eslint/no-floating-promises": "warn",
            "@typescript-eslint/strict-boolean-expressions": "warn",

            // style rules:
            "@typescript-eslint/naming-convention": ["warn",
                {selector: ["variable", "function", "parameter"], format: ["snake_case"]},
                {selector: ["variable", "function", "parameter"], format: ["snake_case"], prefix: ["__"], filter: {regex: "^__", match: true}},
                {selector: ["variable", "function", "parameter"], types: ["function"], format: ["camelCase", "PascalCase"]},
                {selector: ["variable", "function", "parameter"], types: ["function"], format: ["camelCase"], prefix: ["__"], filter: {regex: "^__", match: true}},
                {selector: "typeLike", format: ["PascalCase"]},
            ],
        }
    }],
};