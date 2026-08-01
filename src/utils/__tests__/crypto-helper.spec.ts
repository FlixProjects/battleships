import { CryptoHelper } from "../crypto-helper";
import { appConfig } from "../../config/app-config";

describe("CryptoHelper", () => {
    let cryptoHelper: CryptoHelper;

    beforeEach(() => {
        cryptoHelper = new CryptoHelper();
    });

    describe("addMethod", () => {
        it("should add HTTP method to request string", () => {
            cryptoHelper.addMethod("GET");
            expect(cryptoHelper.request).toBe("GET\n");
        });

        it("should set method property", () => {
            cryptoHelper.addMethod("POST");
            expect(cryptoHelper.method).toBe("POST");
        });
    });

    describe("addURI", () => {
        it("should add URI to request string", () => {
            cryptoHelper.addMethod("GET").addURI("/test");
            expect(cryptoHelper.request).toBe("GET\n/test\n");
        });
    });

    describe("addHeader", () => {
        it("should store headers in lowercase", () => {
            cryptoHelper.addMethod("GET").addURI("/test").addHeader("Content-Type", "application/json").build();

            expect(cryptoHelper.request).toContain("content-type:application/json\n");
        });

        it("should sort headers alphabetically", () => {
            cryptoHelper
                .addMethod("GET")
                .addURI("/test")
                .addHeader("Content-Type", "application/json")
                .addHeader("Accept", "application/json")
                .build();

            const requestLines = cryptoHelper.request.split("\n");
            expect(requestLines[2]).toContain("accept:");
            expect(requestLines[3]).toContain("content-type:");
        });
    });

    describe("hash", () => {
        it("should create SHA256 hash of input string", () => {
            const result = cryptoHelper.hash("test");
            expect(result).toMatch(/^[a-f0-9]{64}$/); // SHA256 hash is 64 characters long
        });
    });

    describe("buildStringToSign", () => {
        it("should build string to sign with correct format", () => {
            const hashedRequest = cryptoHelper.hash("test");
            const result = cryptoHelper.buildStringToSign(hashedRequest);

            expect(result).toContain("AWS4-HMAC-SHA256\n");
            expect(result).toContain(appConfig.awsRegion);
            expect(result).toContain("s3");
            expect(result).toContain("aws4_request");
            expect(result).toContain(hashedRequest);
        });
    });

    describe("buildSigningKey", () => {
        it("should build signing key with correct components", () => {
            const key = cryptoHelper.buildSigningKey();
            expect(Buffer.isBuffer(key)).toBeTruthy();
        });
    });

    describe("toUint8Array", () => {
        it("should convert string to Uint8Array", () => {
            const result = cryptoHelper["toUint8Array"]("test");
            expect(result).toBeInstanceOf(Uint8Array);
        });

        it("should handle ArrayBuffer input", () => {
            const buffer = new ArrayBuffer(4);
            const result = cryptoHelper["toUint8Array"](buffer);
            expect(result).toBeInstanceOf(Uint8Array);
        });
    });

    describe("complete request flow", () => {
        it("should build GET request correctly", () => {
            cryptoHelper.addMethod("GET").addURI("/test").addHeader("Host", "example.com").build();

            expect(cryptoHelper.request).toContain("GET\n");
            expect(cryptoHelper.request).toContain("/test\n");
            expect(cryptoHelper.request).toContain("host:example.com\n");
        });

        it("should build POST request with body correctly", () => {
            const body = JSON.stringify({ test: "data" });

            cryptoHelper
                .addMethod("POST")
                .addURI("/test")
                .addHeader("Content-Type", "application/json")
                .addHeader("Host", "example.com")
                .addBody(body);

            expect(cryptoHelper.request).toContain("POST\n");
            expect(cryptoHelper.request).toContain("/test\n");
            expect(cryptoHelper.request).toContain("content-type:application/json\n");
            expect(cryptoHelper.request).toContain("host:example.com\n");
            expect(cryptoHelper.request).toMatch(/[a-f0-9]{64}$/); // ends with hashed body
        });
    });

    describe("buildSignature", () => {
        it("should return a Buffer signature for a GET request", () => {
            cryptoHelper.addMethod("GET").addURI("/resource").addHeader("Host", "example.com").build();

            const signature = cryptoHelper.buildSignature();
            expect(Buffer.isBuffer(signature)).toBeTruthy();
            expect(signature.length).toBeGreaterThan(0);
        });

        it("should return a Buffer signature for a POST request with body", () => {
            const body = JSON.stringify({ foo: "bar" });
            cryptoHelper
                .addMethod("POST")
                .addURI("/resource")
                .addHeader("Content-Type", "application/json")
                .addHeader("Host", "example.com")
                .addBody(body);

            const signature = cryptoHelper.buildSignature();
            expect(Buffer.isBuffer(signature)).toBeTruthy();
            expect(signature.length).toBeGreaterThan(0);
        });

        it("should produce different signatures for different requests", () => {
            cryptoHelper.addMethod("GET").addURI("/resource1").addHeader("Host", "example.com").build();
            const sig1 = cryptoHelper.buildSignature();

            const cryptoHelper2 = new CryptoHelper();
            cryptoHelper2.addMethod("GET").addURI("/resource2").addHeader("Host", "example.com").build();
            const sig2 = cryptoHelper2.buildSignature();

            expect(sig1.equals(sig2)).toBe(false);
        });
    });

    describe("generateKeyPair", () => {
        it("should generate a key pair and store the private key", async () => {
            const keyPair = await cryptoHelper.generateKeyPair();

            expect(keyPair).toHaveProperty("publicKey");
            expect(keyPair).toHaveProperty("privateKey");
        });
    });
});
