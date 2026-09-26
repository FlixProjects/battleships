import type { CloudFrontHeaders } from "aws-lambda";

interface IEventHeaders {
    headers?: Record<string, string | undefined>;
    multiValueHeaders?: Record<string, string[] | undefined>;
}

/** the subset of a Function URL / API Gateway event that can carry cookies */
export interface ICookieCarrier extends IEventHeaders {
    cookies?: string[];
}

/** Reads one `name=value` pair, tolerating the whitespace after `; ` separators. */
const matchPair = (pair: string, name: string): string | undefined => {
    const separatorIndex = pair.indexOf("=");

    if (separatorIndex === -1 || pair.slice(0, separatorIndex).trim() !== name) {
        return undefined;
    }

    return pair.slice(separatorIndex + 1).trim();
};

/** Scans a set of raw Cookie header values, each of which may hold several pairs. */
const findInHeaderValues = (values: string[], name: string): string | undefined => {
    for (const value of values) {
        for (const pair of value.split(";")) {
            const match = matchPair(pair, name);

            if (match !== undefined) {
                return match;
            }
        }
    }

    return undefined;
};

/**
 * Pulls a single cookie out of a CloudFront header bag. A viewer may split its
 * cookies across several `Cookie` headers, each holding several `name=value`
 * pairs, so both levels have to be walked.
 */
export const getCookie = (headers: CloudFrontHeaders | undefined, name: string): string | undefined =>
    findInHeaderValues(
        (headers?.cookie ?? []).map((header) => header.value),
        name,
    );

/**
 * The regional equivalent of `getCookie`. Function URLs deliver a payload v2 event
 * with a `cookies` array; `sam local start-api` delivers a v1 event where the same
 * data arrives under `multiValueHeaders.Cookie` or a single `headers.cookie`, so all
 * three shapes are accepted.
 */
export const getRequestCookie = (event: ICookieCarrier, name: string): string | undefined => {
    if (event.cookies?.length) {
        return findInHeaderValues(event.cookies, name);
    }

    const multiValue = event.multiValueHeaders?.Cookie ?? event.multiValueHeaders?.cookie;

    if (multiValue?.length) {
        return findInHeaderValues(multiValue, name);
    }

    const single = event.headers?.Cookie ?? event.headers?.cookie;

    if (!single) {
        return undefined;
    }

    return findInHeaderValues([single], name);
};

export const getHeader = (eventHeaders: IEventHeaders, name: string) => {
    const singleValue = eventHeaders.headers;
    const multiValue = eventHeaders.multiValueHeaders;

    // TODO: to consider if we need this elsewhere
    const keyToLowercase = (obj?: Record<string, any>) => {
        if (!obj) return undefined;
        const newObj: Record<string, any> = {};
        Object.entries(obj).forEach(([k, v]) => {
            newObj[k.toLocaleLowerCase()] = v;
        });
        return newObj;
    };

    const formattedName = name.toLocaleLowerCase();

    // we only expect single value for now, and if its present in multivalue instead, take that
    const value = keyToLowercase(singleValue)?.[formattedName] ?? keyToLowercase(multiValue)?.[formattedName]?.[0];

    return value;
};
