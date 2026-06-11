import "reflect-metadata";

jest.mock("uuid", () => {
    let counter = 0;
    return { v7: () => `uuid-${++counter}` };
});

jest.mock("lodash.clonedeep", () => {
    const actual = jest.requireActual("lodash.clonedeep");
    return { __esModule: true, default: actual };
});
