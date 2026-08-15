const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
    testEnvironment: "node",
    transform: {
        ...tsJestTransformCfg,
        "^.+\\.m?js$": ["ts-jest", { tsconfig: { allowJs: true } }], // jose v6 ships ESM only — let ts-jest down-level it to CJS. default preset only transforms ^.+\.tsx?$ so jose's .js files are ignored, jest then routes the files through ts-jest which down-levels them to require/exports. `allowJs: true` is to allow Typescript to compile .js input.
    },
    transformIgnorePatterns: ["/node_modules/(?!jose/)"], // node_modules is not transformed by default; jose must be. Jest assumes packages are CJS, but jose is ESM. Has to be used with transform above
    setupFilesAfterEnv: ['./jest.setup.ts'],
    preset: "ts-jest",
    moduleNameMapper: {
        "^@shared/(.*)$": "<rootDir>/shared/$1",
    },
};
