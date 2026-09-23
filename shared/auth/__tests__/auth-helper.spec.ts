import { generateAuthToken, verifyAuthToken } from "../auth-helper";
import { JwtHelper } from "../jwt-helper";
import * as jose from "jose";
const mockClientToken =
    "eyJhbGciOiJSUzI1NiIsInR5cCI6ImRwb3Arand0IiwiandrIjp7ImUiOiJBUUFCIiwia3R5IjoiUlNBIiwibiI6IndLTDl5bUFKSHJua3d6NWdEUmJXQ08xRHpGZDFvX2M1MC1pa0NQd3RtTHg3Qml2TGFON28tc2plYXVxanY3cHhqd2pVeGpoYnFWOXRmQWE5eUVINjZ3TjlOSXU3ZFZyUm1IaW5uUFVLUWltbXktbFhKMGtxNEtsTU40VU4tRnhMcmVoWEN5RUotYVM5N3o4YnNZVDhPN1dfR0Z1V0lGQm1tMV9lWm5GdGEzaTktWWkzcE43RXJjSDdJU1M1c2YxZVAySko2RDFvWTN1VkJ5V1FJMVlHZ1phR0VYSldiN3BoZzBPRDJFbEp2UmRISkZaMEVXak1nWnZwQjhVaThpTHAtMzdSNnNCb1lEc29FZTI0YVdGVFZGWFo1cVUybERxbFBuNl91aHBlZHlVUTdMOE5RNXFUYlpvWXFuMXNRUUNYejl0QnJRTE1EM19Sel8yZDRuVXBtdyJ9fQ.eyJodG0iOiJHRVQiLCJodHUiOiIvZ2FtZXMiLCJqdGkiOiIwMWEwYjIwOS0xZTBhLTc1MDAtOGMyOC1jMjdjNjI1OTgwZmUiLCJpYXQiOjE3ODk2OTMzMzd9.WfL1cwSopT_4FN2oy6H1CtjRMlygTw54FaP5DJ1VocDPOmF3an4R0kulcg5VFsBocEygGzmkCONsbjC_s1nZUayDeTxiWAMW0fA9oQAXvkWfs_W-MCPWYPGD986oKrcn630ig_d0Jp_G73XROeGXIG6_Yn7cpvtBIiXU_SJXdHi2I-ariiSoPkJWBfFcmjZgzQz-P61gKukV2IZBq-zc5gA2K8GZse5oQw3UOzfkwqBQhEu4yW81X-5qpoFLaXqFJZIFI8RPzE35_bsHJZdJh4ZOwIt_ufVp7JPo5xLM1aWYd2fkubwSOhNLoIBmGT6aQQ7sB_1TtweEdN-hGWbKdw";

const mockAuthToken =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhMDhmZDBlZS0xNmRhLTQ3YjktYTAzOS1jYTYxYjI0NmY2NzMiLCJpYXQiOjE3ODk2OTMzMzYsImNuZiI6eyJqa3QiOiJpRkczczk1NEU3STVPQ3Z0NGRzbHpOMHk5RXI1a2NudXdKcF9PbkRMRjRNIn0sImV4cCI6MTc4OTY5NDIzNn0.ieDe2V614gCF-fd-6SUcWqTcUxdcdA6rJfi2uJFABLc";

const mockClientJwks = {
    e: "AQAB",
    kty: "RSA",
    n: "wKL9ymAJHrnkwz5gDRbWCO1DzFd1o_c50-ikCPwtmLx7BivLaN7o-sjeauqjv7pxjwjUxjhbqV9tfAa9yEH66wN9NIu7dVrRmHinnPUKQimmy-lXJ0kq4KlMN4UN-FxLrehXCyEJ-aS97z8bsYT8O7W_GFuWIFBmm1_eZnFta3i9-Yi3pN7ErcH7ISS5sf1eP2JJ6D1oY3uVByWQI1YGgZaGEXJWb7phg0OD2ElJvRdHJFZ0EWjMgZvpB8Ui8iLp-37R6sBoYDsoEe24aWFTVFXZ5qU2lDqlPn6_uhpedyUQ7L8NQ5qTbZoYqn1sQQCXz9tBrQLMD3_Rz_2d4nUpmw",
};

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

    describe("verifyClientToken", () => {
        xit("sample auth flow", async () => {
            const jwtHelper = new JwtHelper();
            // client ========================
            const { privateKey, publicKey } = await jwtHelper.generateKeyPair();
            const publicJwk = await jwtHelper.exportKey(publicKey);
            // publicJwk sent to server

            // server ========================
            const jkt = await jwtHelper.getThumprint(publicJwk);
            // server stamps the thumbprint onto the auth token
            const token = await generateAuthToken({ userId, secret, thumbprint: jkt });

            // token is sent back to client
            // client ========================
            const clientToken = await new jose.SignJWT({
                htm: "GET",
                htu: "/",
                jti: "123412341234",
            })
                .setProtectedHeader({ alg: "RS256", typ: "dpop+jwt", jwk: publicJwk })
                .setIssuedAt()
                .sign(privateKey);

            // client signs a token on each subsequent request
            // server ========================
            const authPayload = await jwtHelper.verify(token, secret, "HS256");
            // authPayload is not required, but server verifies token from client's cookie in request
            const headers = jose.decodeProtectedHeader(clientToken);

            // thumbprint is extracted from the headers
            // the thumbprint cannot be created without the client's private key
            const clientThumprint = await jwtHelper.getThumprint(headers.jwk!, "sha256");

            const isOwner = jkt === clientThumprint;
            // we still verify token is a valid one using the publicJwk that is sent over
            const clientPayload = await jwtHelper.verifyToken(clientToken, headers.jwk!, { typ: "dpop+jwt" });
        });
    });
});
