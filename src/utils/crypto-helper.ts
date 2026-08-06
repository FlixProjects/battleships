import { createHash, createHmac } from "crypto";
import { appConfig } from "../config/app-config";

type HttpMethod = "GET" | "POST" | "PUT";
type StringEncoding = "ascii" | "utf8" | "utf16le" | "ucs2" | "base64" | "latin1" | "binary" | "hex";

interface TAddHeaderPost {
    addHeader: (key: string, value: string) => TAddHeaderPost;
    addBody: (payload: string) => void;
}

interface TAddHeaderGet {
    addHeader: (key: string, value: string) => TAddHeaderGet;
    build: () => void;
}

interface TAddURIPost {
    addHeader: (key: string, value: string) => TAddHeaderPost;
}

interface TAddURIGet {
    addHeader: (key: string, value: string) => TAddHeaderGet;
}

export class CryptoHelper {
    public request: string = "";
    public method: HttpMethod;
    private headers: Array<[string, string]> = [];

    public buildSignature() {
        const hashedRequest = this.hashRequest();
        const stringToSign = this.buildStringToSign(hashedRequest);
        const signingKey = this.buildSigningKey();

        return this.getSignature(signingKey, stringToSign);
    }

    addMethod(method: "GET"): { addURI: (uri: string) => TAddURIGet };
    addMethod(method: "POST" | "PUT"): { addURI: (uri: string) => TAddURIPost };
    addMethod(method: HttpMethod): { addURI: (uri: string) => TAddURIGet | TAddURIPost } {
        this.method = method;
        this.request += method;
        this.request += "\n";

        if (method === "GET") {
            return { addURI: (uri: string) => this.addGetURI(uri) };
        }
        return { addURI: (uri: string) => this.addPostURI(uri) };
    }

    addURI(uri: string): TAddURIGet | TAddURIPost {
        return this.method === "GET" ? this.addGetURI(uri) : this.addPostURI(uri);
    }

    addBody(payload: string) {
        this.request += this.hash(payload);

        return {
            build: this.buildSignature.bind(this),
        };
    }

    addHeader(key: string, value: string): TAddHeaderPost | TAddHeaderGet {
        return this.method === "GET" ? this.addGetHeader(key, value) : this.addPostHeader(key, value);
    }

    private addGetURI(uri: string): TAddURIGet {
        this.request += uri;
        this.request += "\n";
        return { addHeader: (key, value) => this.addGetHeader(key, value) };
    }

    private addPostURI(uri: string): TAddURIPost {
        this.request += uri;
        this.request += "\n";
        return { addHeader: (key, value) => this.addPostHeader(key, value) };
    }

    private addGetHeader(key: string, value: string): TAddHeaderGet {
        this.headers.push([key.toLowerCase(), value.trim()]);
        return {
            addHeader: (k, v) => this.addGetHeader(k, v),
            build: () => {
                return this.buildHeaders().addBody("").build();
            },
        };
    }

    private addPostHeader(key: string, value: string): TAddHeaderPost {
        this.headers.push([key.toLowerCase(), value.trim()]);
        return {
            addHeader: (k, v) => this.addPostHeader(k, v),
            addBody: (payload: string) => {
                return this.buildHeaders().addBody(payload);
            },
        };
    }

    buildHeaders() {
        this.headers.sort((a, b) => a[0].localeCompare(b[0]));
        this.headers.forEach(([k, v]) => {
            this.request += `${k}:${v}\n`;
        });
        return this;
    }

    hashRequest() {
        return this.hash(this.request);
    }

    hash(toHash: string) {
        return createHash("sha256").update(toHash).digest("hex");
    }

    hmacHash(key: Uint8Array | string | Buffer<ArrayBufferLike>, payload: string) {
        return createHmac("sha256", key).update(this.toUint8Array(payload)).digest();
    }

    buildStringToSign(hashedRequest: string) {
        const scopeDate = new Date().toISOString().split("T")[0];
        const scopeRegion = appConfig.awsRegion;
        const scopeService = "s3";

        const scope = `${scopeDate}/${scopeRegion}/${scopeService}/aws4_request`;
        const timestamp = new Date().toISOString();
        const strToSign = "AWS4-HMAC-SHA256" + "\n" + timestamp + "\n" + scope + "\n";

        return strToSign + hashedRequest;
    }

    buildSigningKey() {
        const scopeDate = new Date().toISOString().split("T")[0];
        const scopeRegion = appConfig.awsRegion;
        const scopeService = "s3";

        const signables = [scopeDate, scopeRegion, scopeService, "aws4_request"];

        let key: Uint8Array | string | Buffer<ArrayBufferLike> = "AWS4" + appConfig.awsSecretAccessKey;

        signables.forEach((signable) => {
            key = this.hmacHash(key, signable);
        });

        return key;
    }

    private getSignature(signingKey: string, stringToSign: string) {
        return this.hmacHash(signingKey, stringToSign);
    }

    private toUint8Array(data: string | ArrayBuffer | ArrayBufferView): Uint8Array {
        if (typeof data === "string") {
            return this.fromUtf8(data);
        }

        if (ArrayBuffer.isView(data)) {
            return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
        }

        return new Uint8Array(data);
    }

    private fromUtf8(input: string): Uint8Array {
        const buf = this.fromString(input, "utf8");
        return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength / Uint8Array.BYTES_PER_ELEMENT);
    }

    private fromString(input: string, encoding?: StringEncoding): Buffer {
        if (typeof input !== "string") {
            throw new TypeError(
                `The "input" argument must be of type string. Received type ${typeof input} (${input})`,
            );
        }

        return encoding ? Buffer.from(input, encoding) : Buffer.from(input);
    }
}
