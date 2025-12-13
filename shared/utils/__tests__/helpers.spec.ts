import { mergeSets } from "../helpers";

jest.mock("uuid", () => ({
    v7: () => "uuid",
}));

describe("mergeSets", () => {
    it("should merge sets", () => {
        const set1 = new Set([1, 2, 3]);
        const set2 = new Set([2, 3, 4]);
        const mergedSet = mergeSets([set1, set2]);
        expect(mergedSet).toEqual(new Set([1, 2, 3, 4]));
    });
    it("should merge string sets", () => {
        const set1 = new Set(["1", "2", "3"]);
        const set2 = new Set(["2", "3", "4"]);
        const mergedSet = mergeSets([set1, set2]);
        expect(mergedSet).toEqual(new Set(["1", "2", "3", "4"]));
    })
    it("should handle single array", () => {
        const set1 = new Set([1, 2, 3]);
        const mergedSet = mergeSets([set1]);
        expect(mergedSet).toEqual(new Set([1, 2, 3]));
    })
});
