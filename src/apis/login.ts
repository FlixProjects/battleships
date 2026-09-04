import { AuthResponse, AuthResponseBody, SignUpRequest } from "@shared/index";
import { idb } from "..";
import { JwtHelper } from "../../shared/auth/jwt-helper";
import { ApiError, useApi } from "./use-api";

export const login = async (username: string, password: string): Promise<AuthResponse> => {
    try {
        const publicKey = await idb.get("publicKey");

        if (!publicKey.value) {
            throw new Error("Public key not found in IndexedDB.");
        }

        const reqBody: SignUpRequest = {
            username,
            password,
            publicJwk: await new JwtHelper().exportKey(publicKey.value),
        };

        const result = await useApi<SignUpRequest, AuthResponseBody>({
            path: "/login",
            method: "POST",
            body: reqBody,
        });

        if (!result?.data.playerId) {
            throw new Error("No playerId returned.");
        }

        return { statusCode: result?.status ?? 500, playerId: result.data.playerId };
    } catch (err) {
        console.error(err);
        return { statusCode: err instanceof ApiError ? err.status : 500 };
    }
};
