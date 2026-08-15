import { JwtHelper } from "../jwt-helper";

describe("JwtHelper", () => {
    let jwtHelper: JwtHelper;

    beforeEach(() => {
        jwtHelper = new JwtHelper();
    });

    describe("generateKeyPair", () => {
        it("should generate a key pair and store the private key", async () => {
            const keyPair = await jwtHelper.generateKeyPair();

            expect(keyPair).toHaveProperty("publicKey");
            expect(keyPair).toHaveProperty("privateKey");
        });
    });

    describe("generateSecret", () => {
        it("should generate a 256-bit base64url secret", async () => {
            const secret = jwtHelper.generateSecret();

            // 32 bytes base64url-encoded, unpadded
            expect(secret).toMatch(/^[A-Za-z0-9_-]{43}$/);
            expect(jwtHelper.generateSecret()).not.toEqual(secret);
        });
    });

    describe("sign / verify", () => {
        it("should sign and verify a payload with RS256", async () => {
            const keyPair = await jwtHelper.generateKeyPair();
            const payload = { message: "Hello, world!" };

            const token = await jwtHelper.sign(payload, keyPair.privateKey);
            expect(token).toBeDefined();

            const verified = await jwtHelper.verify(token, keyPair.publicKey);
            expect(verified).toMatchObject(payload);
        });

        it("should produce a compact three-part token", async () => {
            const keyPair = await jwtHelper.generateKeyPair();

            const token = await jwtHelper.sign({ message: "compact" }, keyPair.privateKey);

            expect(token.split(".")).toHaveLength(3);
        });

        it("should sign and verify with a symmetric secret", async () => {
            const secret = jwtHelper.generateSecret();

            const token = await jwtHelper.sign({ id: "user-1" }, secret, "HS256");
            const verified = await jwtHelper.verify(token, secret, "HS256");

            expect(verified).toMatchObject({ id: "user-1" });
        });

        it("should reject a token signed with a different secret", async () => {
            const token = await jwtHelper.sign({ id: "user-1" }, jwtHelper.generateSecret(), "HS256");

            await expect(jwtHelper.verify(token, jwtHelper.generateSecret(), "HS256")).rejects.toThrow();
        });

        it("should reject an expired token", async () => {
            const secret = jwtHelper.generateSecret();
            const expiredAt = Math.floor(Date.now() / 1000) - 60;

            const token = await jwtHelper.sign({ id: "user-1", exp: expiredAt }, secret, "HS256");

            await expect(jwtHelper.verify(token, secret, "HS256")).rejects.toThrow();
        });
    });

    describe("encrypt / decrypt", () => {
        it("should round-trip a payload", async () => {
            const secret = jwtHelper.generateSecret();

            const token = await jwtHelper.encrypt({ id: "user-1" }, secret);
            const decrypted = await jwtHelper.decrypt(token, secret);

            expect(decrypted).toMatchObject({ id: "user-1" });
        });

        it("should not leak the payload into the token", async () => {
            const secret = jwtHelper.generateSecret();

            const token = await jwtHelper.encrypt({ id: "top-secret-user" }, secret);

            // a *signed* token would carry this in readable base64url
            expect(Buffer.from(token.split(".")[1] ?? "", "base64url").toString()).not.toContain("top-secret-user");
            expect(token.split(".")).toHaveLength(5);
        });

        it("should reject a token encrypted under a different secret", async () => {
            const token = await jwtHelper.encrypt({ id: "user-1" }, jwtHelper.generateSecret());

            await expect(jwtHelper.decrypt(token, jwtHelper.generateSecret())).rejects.toThrow();
        });
    });
});
