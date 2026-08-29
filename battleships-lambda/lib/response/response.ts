import { SuccessCode, THttpResponseCode } from "../../../shared/types/response-types";
import { isLocal } from "../env";
import { type IApiResponseProps, type PlainApiResponse } from "./types";

const SET_COOKIE = "Set-Cookie";

export class ApiResponse {
    statusCode: THttpResponseCode;
    headers: Record<string, string>;
    multiValueHeaders: Record<string, Array<string>> = {};
    body: object;

    constructor({ statusCode = SuccessCode.SUCCESS, headers = {}, body = {} }: IApiResponseProps = {}) {
        this.statusCode = statusCode;
        this.body = body;
        this.headers = { ...this.getCorsHeaders(), ...headers };
    }

    public setHeaders(headers: Record<string, string>) {
        this.headers = { ...this.headers, ...headers };
        return this;
    }

    public setBody(body: object) {
        this.body = { ...this.body, ...body };
        return this;
    }

    public setStatusCode(statusCode: THttpResponseCode) {
        this.statusCode = statusCode;
        return this;
    }

    public setCookie(key: string, value: string) {
        const cookieConfig = isLocal() ? `Path=/; Secure; SameSite=Strict; HttpOnly;` : `Path=/; SameSite=Lax`
        this.setHeaders({"Set-Cookie": `${key}=${value}; ${cookieConfig}`})
        return this;
    }

    public build(): PlainApiResponse {
        const response: PlainApiResponse = {
            statusCode: this.statusCode,
            headers: this.headers,
            body: JSON.stringify(this.body),
        };

        if (Object.keys(this.multiValueHeaders).length > 0) {
            response.multiValueHeaders = this.multiValueHeaders;
        }

        return response;
    }

    private getCorsHeaders(): Record<string, string> {
        return {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Origin": this.getAllowedOrigin(),
        };
    }

    private getAllowedOrigin(): string {
        if (isLocal()) {
            return "*";
        }
        return process.env.BASE_URL ?? "*";
    }
}
