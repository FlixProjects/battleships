import { ERROR_MESSAGES } from "@shared/constants";
import { ErrorCode } from "@shared/types/response-types";
import { gameManager } from "..";
import { appConfig, isLocal } from "../config/app-config";
import { CryptoHelper } from "../utils/crypto-helper";

interface ApiConfig<TBody> {
    /** Appended to the api base, leading slash included; omit for the root route (get-game). */
    path?: `/${string}`;
    method: "POST" | "GET";
    headers?: HeadersInit | undefined;
    query?: Record<string, string>;
    body?: TBody;
    /** Swallows the failure when supplied; without it the error is rethrown. */
    onError?: (err: Error) => void;
}

export interface ApiResult<TResponse> {
    status: number;
    data: TResponse;
}

/** Thrown for a non-2xx response, which `fetch` itself resolves rather than rejects. */
export class ApiError extends Error {
    public status: number;
    public message: string;
    constructor(res: { status: number; message: string }, path: string) {
        super(`api ${path || "/"} failed with ${status}.`);
        this.name = "ApiError";
        this.status = res.status;
        this.message = res.message ?? `api ${path || "/"} failed with ${this.status}.`;
    }

    get outcomeIsExpiredToken(): boolean {
        return this.status === ErrorCode.AUTHORIZATION_FAILED && this.message === ERROR_MESSAGES.EXPIRED_TOKEN;
    }

    get outcomeIsMissingToken(): boolean {
        return this.status === ErrorCode.UNAUTHORISED && this.message === ERROR_MESSAGES.MISSING_TOKEN;
    }
}

const buildUrl = (path: string, query?: Record<string, string>): string => {
    const base = isLocal ? "/api" : appConfig.apiBaseUrl;
    const params = new URLSearchParams(query).toString();
    const url = `${base}${path}`;

    return params ? `${url}?${params}` : url;
};

export const useApi = async <TBody, TResponse>(config: ApiConfig<TBody>): Promise<ApiResult<TResponse> | undefined> => {
    const { path = "", method, headers, query, onError, body } = config;
    const reqBody = JSON.stringify(body);
    const baseHeaders: HeadersInit = {
        "Content-Type": "application/json",
        ...(body ? { "x-Amz-Content-Sha256": new CryptoHelper().hash(reqBody) } : {}),
    };

    try {
        const res = await fetch(buildUrl(path, query), {
            method,
            credentials: "include",
            headers: { ...baseHeaders, ...(headers ?? {}) },
            body: reqBody,
        });

        const status = res.status;
        const data = await res.json();

        if (!res.ok) {
            throw new ApiError({ status, message: data.message }, path);
        }

        return { status, data: data as TResponse };
    } catch (err) {
        if (err instanceof ApiError && (err.outcomeIsExpiredToken || err.outcomeIsMissingToken)) {
            console.log(
                `api ${err.outcomeIsExpiredToken ? "expired" : "missing"} token, clearing local state and reloading`,
            );
            gameManager.resetGame();
            return;
        }

        if (onError && err instanceof Error) {
            onError(err);
            return;
        }

        throw new Error(`api ${path || "/"} failed.`);
    }
};
