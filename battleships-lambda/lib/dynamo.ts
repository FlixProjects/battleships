import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { isLocal } from "./env";

const DEFAULT_REGION = "ap-southeast-1";
const DEFAULT_LOCAL_ENDPOINT = "http://dynamodb-local:8000";

export const USERS_TABLE = process.env.USERS_TABLE ?? "battleships-users";
export const GAMES_TABLE = process.env.GAMES_TABLE ?? "battleships-games";

let docClient: DynamoDBDocumentClient | undefined;

export const getDocClient = (): DynamoDBDocumentClient => {
    if (docClient) {
        return docClient;
    }

    const config: DynamoDBClientConfig = { region: process.env.AWS_REGION ?? DEFAULT_REGION };

    if (isLocal()) {
        // DynamoDB Local ignores the credential values, but the SDK refuses to sign without them
        config.endpoint = process.env.DYNAMODB_ENDPOINT ?? DEFAULT_LOCAL_ENDPOINT;
        config.credentials = { accessKeyId: "local", secretAccessKey: "local" };
    }

    docClient = DynamoDBDocumentClient.from(new DynamoDBClient(config), {
        marshallOptions: { removeUndefinedValues: true },
    });

    return docClient;
};

// DynamoDB caps BatchWriteItem at 25 requests per call
const BATCH_WRITE_LIMIT = 25;

// best-effort: failed or unprocessed deletes are logged rather than thrown
export const batchDeleteItems = async (tableName: string, keys: Record<string, string>[]): Promise<void> => {
    const batches: Record<string, string>[][] = [];
    for (let idx = 0; idx < keys.length; idx += BATCH_WRITE_LIMIT) {
        batches.push(keys.slice(idx, idx + BATCH_WRITE_LIMIT));
    }

    const results = await Promise.allSettled(
        batches.map((batch) =>
            getDocClient().send(
                new BatchWriteCommand({
                    RequestItems: { [tableName]: batch.map((key) => ({ DeleteRequest: { Key: key } })) },
                }),
            ),
        ),
    );

    results.forEach((result, idx) => {
        if (result.status === "rejected") {
            console.error(`batch delete from ${tableName} failed`, batches[idx], result.reason);
            return;
        }
        const unprocessed = result.value.UnprocessedItems?.[tableName];
        if (unprocessed?.length) {
            console.error(`batch delete from ${tableName} left ${unprocessed.length} items undeleted`);
        }
    });
};
