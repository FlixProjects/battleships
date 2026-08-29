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
    public readonly status: number;

    constructor(status: number, path: string) {
        super(`api ${path || "/"} failed with ${status}.`);
        this.name = "ApiError";
        this.status = status;
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

        if (!res.ok) {
            throw new ApiError(res.status, path);
        }

        return { status: res.status, data: (await res.json()) as TResponse };
    } catch (err) {
        const error = err instanceof Error ? err : new Error(`api ${path || "/"} failed.`);

        if (!onError) {
            throw error;
        }

        onError(error);
    }
};
