import { AuthResponse, GuestLoginRequest } from "@shared/index";
import { idb } from "..";
import { appConfig, isLocal } from "../config/app-config";
import { CryptoHelper } from "../utils/crypto-helper";
import { JwtHelper } from "../../shared/auth/jwt-helper";

export const guestLogin = async (): Promise<AuthResponse> => {
    try {
        const path = `login`;
        const queryParams = `guest=true`;
        const url = isLocal ? `/api/${path}?${queryParams}` : `${appConfig.apiBaseUrl}/${path}?${queryParams}`;

        const publicKey = await idb.get("publicKey");

        if (!publicKey.value) {
            throw new Error("Public key not found in IndexedDB.");
        }

        const reqBody: GuestLoginRequest = {
            publicJwk: await new JwtHelper().exportKey(publicKey.value),
        };

        const config: RequestInit = {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "x-Amz-Content-Sha256": new CryptoHelper().hash(JSON.stringify(reqBody)),
            },
        };

        const res = await fetch(url, {
            ...config,
            body: JSON.stringify(reqBody),
        });
        await res.json();

        return { statusCode: res.status };
    } catch (err) {
        console.error(err);
        return { statusCode: 500 };
    }
};
