import { SignUpRequest } from "@shared/index";
import { idb } from "..";
import { appConfig, isLocal } from "../config/app-config";
import { CryptoHelper } from "../utils/crypto-helper";
import { JwtHelper } from "../../shared/auth/jwt-helper";

export const login = async (username: string, password: string) => {
    try {
        const path = `login`;
        const url = isLocal ? `/api/${path}` : `${appConfig.apiBaseUrl}/${path}`;

        const publicKey = await idb.get("publicKey");

        if (!publicKey.value) {
            throw new Error("Public key not found in IndexedDB.");
        }

        const reqBody: SignUpRequest = {
            username,
            password,
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
        const data = await res.json();

        return data;
    } catch (err) {
        console.error(err);
    }
};
