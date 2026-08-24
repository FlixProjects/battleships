import { generateAuthToken, verifyAuthToken } from "../auth-helper";
import { JwtHelper } from "../jwt-helper";

describe("auth-helper", () => {
    const secret = new JwtHelper().generateSecret();
    const userId = "test-user-id";

    describe("generateAuthToken", () => {
        it("should generate a valid JWT token", async () => {
            const token = await generateAuthToken(userId, secret);

            expect(token).toBeDefined();
            expect(typeof token).toBe("string");
        });
    });

    describe("verifyAuthToken", () => {
        it("should resolve a token minted with the same secret to its subject", async () => {
            const token = await generateAuthToken(userId, secret);

            await expect(verifyAuthToken(token, secret)).resolves.toBe(userId);
        });

        it("should reject a token minted with a different secret", async () => {
            const token = await generateAuthToken(userId, new JwtHelper().generateSecret());

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
