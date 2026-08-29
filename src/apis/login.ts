import { AuthResponse, SignUpRequest } from "@shared/index";
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

        const result = await useApi<SignUpRequest, AuthResponse>({
            path: "/login",
            method: "POST",
            body: reqBody,
        });

        return { statusCode: result?.status ?? 500 };
    } catch (err) {
        console.error(err);
        return { statusCode: err instanceof ApiError ? err.status : 500 };
    }
};
