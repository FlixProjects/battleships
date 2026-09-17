import { JwtHelper } from "@shared/auth/jwt-helper";
import { FP_CLIENT_TOKEN } from "@shared/constants";
import { IClientAuthHeaders } from "@shared/index";
import * as jose from "jose";
import { v7 as uuidv7 } from "uuid";
import { idb } from "..";

interface ISigningConfig<TBody> {
    path?: string;
    method: "POST" | "GET";
    headers?: HeadersInit | undefined;
    query?: Record<string, string>;
    body?: TBody;
}

export const useToken = async <TBody, TResult>(
    config: ISigningConfig<TBody>,
    apiFn: (authHeaders?: IClientAuthHeaders) => Promise<TResult>,
) => {
    const { method, path, body } = config;
    const privateKey = (await idb.get("privateKey")).value;
    const publicKey = (await idb.get("publicKey")).value;

    if (!publicKey || !privateKey) {
        return await apiFn();
    }
    const publicJwk = await new JwtHelper().exportKey(publicKey);

    const proof = await new jose.SignJWT({
        htm: method,
        htu: path,
        jti: uuidv7(),
    })
        .setProtectedHeader({ alg: "RS256", typ: "dpop+jwt", jwk: publicJwk })
        .setIssuedAt()
        .sign(privateKey); // await jose.importJWK(privateJwk, "RS256")

    return await apiFn({ [FP_CLIENT_TOKEN]: proof });
};
