import type { CloudFrontHeaders } from "aws-lambda";

/**
 * Pulls a single cookie out of a CloudFront header bag. A viewer may split its
 * cookies across several `Cookie` headers, each holding several `name=value`
 * pairs, so both levels have to be walked.
 */
export const getCookie = (headers: CloudFrontHeaders | undefined, name: string): string | undefined => {
    for (const header of headers?.cookie ?? []) {
        for (const pair of header.value.split(";")) {
            const separatorIndex = pair.indexOf("=");
            if (separatorIndex === -1) {
                continue;
            }

            if (pair.slice(0, separatorIndex).trim() === name) {
                return pair.slice(separatorIndex + 1).trim();
            }
        }
    }

    return undefined;
};
