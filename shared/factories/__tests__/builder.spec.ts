import { Builder } from "../builder";

interface TestObject {
    id: string;
    name: string;
    count: number;
    nested?: {
        value: string;
        items: string[];
    };
}

class TestBuilder extends Builder<TestObject> {
    constructor(overrides: Partial<TestObject> = {}) {
        super(
            {
                id: "default-id",
                name: "default-name",
                count: 0,
            },
            overrides
        );
    }
}

describe("Builder", () => {
    describe("constructor", () => {
        it("initializes with default props", () => {
            const builder = new TestBuilder();
            const result = builder.build();
            expect(result).toEqual({
                id: "default-id",
                name: "default-name",
                count: 0,
            });
        });

        it("merges default overrides in constructor", () => {
            const builder = new TestBuilder({ name: "custom-default" });
            const result = builder.build();
            expect(result.name).toBe("custom-default");
        });
    });

    describe("build", () => {
        it("returns object with default props when no overrides", () => {
            const builder = new TestBuilder();
            const result = builder.build();
            expect(result).toEqual({
                id: "default-id",
                name: "default-name",
                count: 0,
            });
        });

        it("accepts empty object as overrides", () => {
            const builder = new TestBuilder();
            const result = builder.build({});
            expect(result).toEqual({
                id: "default-id",
                name: "default-name",
                count: 0,
            });
        });

        it("merges overrides with defaults", () => {
            const builder = new TestBuilder();
            const result = builder.build({ name: "override-name", count: 5 });
            expect(result).toEqual({
                id: "default-id",
                name: "override-name",
                count: 5,
            });
        });

        it("handles nested object overrides", () => {
            const builder = new TestBuilder({
                nested: { value: "default", items: ["a"] },
            });
            const result = builder.build({
                nested: { value: "override", items: ["b", "c"] },
            });
            expect(result.nested).toEqual({
                value: "override",
                items: ["b", "c"],
            });
        });
    });

    describe("immutability - no mutation", () => {
        it("does not mutate defaultProps when building with different values", () => {
            const builder = new TestBuilder();
            const originalDefaultProps = JSON.parse(JSON.stringify(builder["defaultProps"]));
            
            builder.build({ name: "mutated", count: 99 });
            builder.build({ id: "new-id", count: 50 });
            
            expect(builder["defaultProps"]).toEqual(originalDefaultProps);
        });

        it("does not mutate defaultOverrides passed to constructor", () => {
            const defaultOverrides = { name: "custom-default", count: 10 };
            const originalDefaultOverrides = JSON.parse(JSON.stringify(defaultOverrides));
            
            const builder = new TestBuilder(defaultOverrides);
            builder.build({ name: "different", count: 99 });
            
            expect(defaultOverrides).toEqual(originalDefaultOverrides);
        });

        it("does not mutate overrides passed to build", () => {
            const builder = new TestBuilder();
            const overrides = { name: "test", count: 10 };
            const originalOverrides = JSON.parse(JSON.stringify(overrides));
            
            builder.build(overrides);
            builder.build({ name: "other" });
            
            expect(overrides).toEqual(originalOverrides);
        });

        it("does not mutate nested objects in defaultOverrides", () => {
            const defaultOverrides = {
                nested: { value: "original", items: ["x", "y"] },
            };
            const originalDefaultOverrides = JSON.parse(JSON.stringify(defaultOverrides));
            
            const builder = new TestBuilder(defaultOverrides);
            builder.build({ nested: { value: "changed", items: ["a", "b"] } });
            
            expect(defaultOverrides).toEqual(originalDefaultOverrides);
        });

        it("does not mutate nested objects in overrides", () => {
            const builder = new TestBuilder();
            const overrides = {
                nested: { value: "test", items: ["1", "2"] },
            };
            const originalOverrides = JSON.parse(JSON.stringify(overrides));
            
            builder.build(overrides);
            builder.build({ name: "other" });
            
            expect(overrides).toEqual(originalOverrides);
        });

        it("returns new object on each build call", () => {
            const builder = new TestBuilder();
            const result1 = builder.build({ count: 1 });
            const result2 = builder.build({ count: 2 });
            
            expect(result1).not.toBe(result2);
            expect(result1.count).toBe(1);
            expect(result2.count).toBe(2);
        });

        it("does not share nested object references between builds", () => {
            const builder = new TestBuilder({
                nested: { value: "default", items: ["a"] },
            });
            
            const result1 = builder.build();
            const result2 = builder.build();
            
            result1.nested!.items.push("b");
            
            expect(result2.nested!.items).toEqual(["a"]);
        });
    });
});
