import * as jose from "jose";

export class JwtHelper {
    public async generateKeyPair() {
        const keyPair = await jose.generateKeyPair("RS256");
        return keyPair;
    }
    public async exportKey(key: CryptoKey) {
        return await jose.exportJWK(key);
    }
}
