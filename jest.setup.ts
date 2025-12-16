import "reflect-metadata";

jest.mock("uuid", () => ({
    v7: () => "uuid",
}));

jest.mock("lodash.clonedeep", () => {
    const actual = jest.requireActual("lodash.clonedeep");
    return { __esModule: true, default: actual };
});
