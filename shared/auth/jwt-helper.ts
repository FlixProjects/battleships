import * as jose from "jose";

/** RS256 for the client's DPoP proofs (asymmetric), HS256 for tokens the server
 *  both issues and verifies (symmetric). */
export type TSignatureAlgorithm = "RS256" | "HS256";

/** A symmetric secret, accepted either as the base64url string that lives in an
 *  env var or as already-decoded bytes / a WebCrypto handle. */
export type TSecret = string | Uint8Array | CryptoKey;

const SECRET_BYTES = 32;
// `dir` uses the secret as the content-encryption key directly, so there is no
// wrapped key to manage; A256GCM is what fixes the secret at 32 bytes.
const ENCRYPTION_ALG = "dir";
const ENCRYPTION_ENC = "A256GCM";

const toKeyInput = (secret: TSecret): Uint8Array | CryptoKey => {
    if (typeof secret === "string") {
        return jose.base64url.decode(secret);
    }
    return secret;
};

export class JwtHelper {
    public async generateKeyPair() {
        const keyPair = await jose.generateKeyPair("RS256");
        return keyPair;
    }

    /**
     * A 256-bit symmetric secret as base64url — long enough for HS256 and
     * exactly the length `dir` + A256GCM requires. Returned as a string so it
     * drops straight into an env var or secret store.
     */
    public generateSecret(): string {
        return jose.base64url.encode(crypto.getRandomValues(new Uint8Array(SECRET_BYTES)));
    }

    public async exportKey(key: CryptoKey) {
        return await jose.exportJWK(key);
    }

    public async importKey(jwk: jose.JWK) {
        return await jose.importJWK(jwk, "RS256");
    }

    /**
     * Signed, not encrypted: the payload is base64url and readable by anyone
     * holding the token. Set `exp` on the payload to have `verify` reject it
     * once expired.
     */
    public async sign(payload: jose.JWTPayload, key: TSecret, alg: TSignatureAlgorithm = "RS256"): Promise<string> {
        return await new jose.SignJWT(payload).setProtectedHeader({ alg }).setIssuedAt().sign(toKeyInput(key));
    }

    public async verify(token: string, key: TSecret, alg: TSignatureAlgorithm = "RS256"): Promise<jose.JWTPayload> {
        // the algorithm is pinned by the caller rather than read from the token
        // header, otherwise an attacker picks the algorithm we verify with
        const { payload } = await jose.jwtVerify(token, toKeyInput(key), { algorithms: [alg] });
        return payload;
    }

    /**
     * Encrypted (JWE) rather than signed — the payload is opaque to whoever
     * holds the token, and A256GCM authenticates it, so tampering fails to
     * decrypt. Use this when the claims themselves should not be readable.
     */
    public async encrypt(payload: jose.JWTPayload, secret: TSecret): Promise<string> {
        return await new jose.EncryptJWT(payload)
            .setProtectedHeader({ alg: ENCRYPTION_ALG, enc: ENCRYPTION_ENC })
            .setIssuedAt()
            .encrypt(toKeyInput(secret));
    }

    public async decrypt(token: string, secret: TSecret): Promise<jose.JWTPayload> {
        const { payload } = await jose.jwtDecrypt(token, toKeyInput(secret), {
            keyManagementAlgorithms: [ENCRYPTION_ALG],
            contentEncryptionAlgorithms: [ENCRYPTION_ENC],
        });
        return payload;
    }
}
