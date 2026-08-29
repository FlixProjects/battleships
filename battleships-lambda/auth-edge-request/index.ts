import type { CloudFrontRequestEvent, CloudFrontRequestResult, CloudFrontResultResponse } from "aws-lambda";
import { getCookie } from "../lib/cookie-helper";

const FP_AUTH_TOKEN = "fp-auth-token";

const forbidden = (): CloudFrontResultResponse => ({
    status: "403",
    statusDescription: "Forbidden",
    headers: {
        "content-type": [{ key: "Content-Type", value: "application/json" }],
        // an auth decision must never be served out of a shared cache
        "cache-control": [{ key: "Cache-Control", value: "no-store" }],
    },
    body: JSON.stringify({ message: "authentication required" }),
});

// DEPRECATED
export const handler = async (event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> => {
    const request = event.Records?.[0]?.cf?.request;

    if (!request) {
        return forbidden();
    }

    if (!getCookie(request.headers, FP_AUTH_TOKEN)) {
        // TODO: for document requests a 302 to the landing page reads better
        // than a bare 403 — swap once there is a login route to point at.
        return forbidden();
    }

    // returning the request unchanged lets CloudFront continue to the origin
    return request;
};
