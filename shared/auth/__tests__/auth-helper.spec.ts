import { generateAuthToken } from "../auth-helper";

describe("auth-helper", () => {
    describe("generateAuthToken", () => {
        it("should generate a valid JWT token", async () => {
            const userId = "test-user-id";
            const token = await generateAuthToken(userId);
            
            expect(token).toBeDefined();
            expect(typeof token).toBe("string");
        });
    })
})