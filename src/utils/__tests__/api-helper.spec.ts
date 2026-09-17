import { sortQueries } from "../api-helper";

describe("sortQueries", () => {
    it("should return undefined when no queries are given", () => {
        expect(sortQueries()).toBeUndefined();
        expect(sortQueries(undefined)).toBeUndefined();
    });

    it("should return an empty string for an empty object", () => {
        expect(sortQueries({})).toBe("");
    });

    it("should serialise a single pair", () => {
        expect(sortQueries({ code: "ABC123" })).toBe("code=ABC123");
    });

    it("should order pairs by key", () => {
        expect(sortQueries({ c: "3", a: "1", b: "2" })).toBe("a=1&b=2&c=3");
    });

    it("should sort by key, not by value", () => {
        expect(sortQueries({ b: "1", a: "2" })).toBe("a=2&b=1");
    });

    it("should produce the same string regardless of insertion order", () => {
        const first = sortQueries({ code: "ABC123", guest: "true", page: "2" });
        const second = sortQueries({ page: "2", guest: "true", code: "ABC123" });

        expect(first).toBe(second);
    });

    it("should url-encode reserved characters in values", () => {
        expect(sortQueries({ q: "a b&c=d" })).toBe("q=a+b%26c%3Dd");
    });

    it("should url-encode non-ascii values", () => {
        expect(sortQueries({ name: "船" })).toBe("name=%E8%88%B9");
    });

    it("should keep keys with empty values", () => {
        expect(sortQueries({ b: "", a: "1" })).toBe("a=1&b=");
    });

    it("should not mutate the input", () => {
        const queries = { b: "2", a: "1" };

        sortQueries(queries);

        expect(Object.keys(queries)).toEqual(["b", "a"]);
    });

    it("should match after a round trip through the decoded query the server receives", () => {
        const sent = { page: "2", code: "A B&C", name: "船" };
        const url = new URL(`https://example.com/api?${new URLSearchParams(sent).toString()}`);
        const received = Object.fromEntries(url.searchParams);

        expect(sortQueries(received)).toBe(sortQueries(sent));
    });
});
