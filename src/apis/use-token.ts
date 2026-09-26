import { JwtHelper } from "@shared/auth/jwt-helper";
import { FP_CLIENT_TOKEN } from "@shared/constants";
import { IClientAuthHeaders } from "@shared/index";
import { v7 as uuidv7 } from "uuid";
import { idb } from "..";

interface ISigningConfig {
    path?: string;
    method: "POST" | "GET";
    headers?: HeadersInit | undefined;
    query?: string;
    bodyHash?: string;
}

export const useToken = async <TResult>(
    config: ISigningConfig,
    apiFn: (authHeaders?: IClientAuthHeaders) => Promise<TResult>,
) => {
    if (!idb) return;
    const { method, path, bodyHash, query } = config;

    const privateKey = (await idb.get("privateKey")).value;
    const publicKey = (await idb.get("publicKey")).value;

    if (!publicKey || !privateKey) {
        return await apiFn();
    }
    const jwtHelper = new JwtHelper();
    const publicJwk = await jwtHelper.exportKey(publicKey);

    const proof = await (
        await jwtHelper.signJwt({
            htm: method,
            htu: path,
            jti: uuidv7(),
            ...(bodyHash ? { bodyHash } : {}),
            query,
        })
    )
        .setProtectedHeader({ alg: "RS256", typ: "dpop+jwt", jwk: publicJwk })
        .setIssuedAt()
        .sign(privateKey); // await jose.importJWK(privateJwk, "RS256")

    return await apiFn({ [FP_CLIENT_TOKEN]: proof });
};
