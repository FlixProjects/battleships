import { generateAuthToken, verifyAuthToken } from "../auth-helper";
import { JwtHelper } from "../jwt-helper";

describe("auth-helper", () => {
    const secret = new JwtHelper().generateSecret();
    const userId = "test-user-id";
    const thumbprint = "test-jkt-thumbprint";

    describe("generateAuthToken", () => {
        it("should generate a valid JWT token", async () => {
            const token = await generateAuthToken({ userId, secret, thumbprint });

            expect(token).toBeDefined();
            expect(typeof token).toBe("string");
        });

        it("should bind the token to the thumbprint and set a 15 minute expiry", async () => {
            const before = Math.floor(Date.now() / 1000);
            const token = await generateAuthToken({ userId, secret, thumbprint });
            const after = Math.floor(Date.now() / 1000);
            const payload = await new JwtHelper().verify(token, secret, "HS256");

            expect(payload.sub).toBe(userId);
            expect(payload.cnf).toEqual({ jkt: thumbprint });
            expect(payload.exp).toBeGreaterThanOrEqual(before + 60 * 15);
            expect(payload.exp).toBeLessThanOrEqual(after + 60 * 15);
        });
    });

    describe("verifyAuthToken", () => {
        it("should resolve a token minted with the same secret to its subject", async () => {
            const token = await generateAuthToken({ userId, secret, thumbprint });

            await expect(verifyAuthToken(token, secret)).resolves.toBe(userId);
        });

        it("should reject a token minted with a different secret", async () => {
            const token = await generateAuthToken({ userId, secret: new JwtHelper().generateSecret(), thumbprint });

            await expect(verifyAuthToken(token, secret)).rejects.toThrow();
        });

        it("should reject an expired token", async () => {
            const expired = await new JwtHelper().sign(
                { sub: userId, exp: Math.floor(Date.now() / 1000) - 1 },
                secret,
                "HS256",
            );

            await expect(verifyAuthToken(expired, secret)).rejects.toThrow();
        });

        it("should reject a token with no subject", async () => {
            const subjectless = await new JwtHelper().sign({ role: "player" }, secret, "HS256");

            await expect(verifyAuthToken(subjectless, secret)).rejects.toThrow("auth token has no subject");
        });

        it("should reject a token signed with an algorithm it does not pin", async () => {
            const { privateKey } = await new JwtHelper().generateKeyPair();
            const rsaToken = await new JwtHelper().sign({ sub: userId }, privateKey, "RS256");

            await expect(verifyAuthToken(rsaToken, secret)).rejects.toThrow();
        });
    });
});
