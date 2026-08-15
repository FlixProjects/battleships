import { CreateTableCommand, DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";

// Run from the host, so DynamoDB Local is reached on its published port rather
// than by container name. The container runs with -inMemory, which means this
// has to run again after every `db:up`.
const ENDPOINT = process.env.DYNAMODB_ENDPOINT ?? "http://localhost:8000";
const REGION = process.env.AWS_REGION ?? "ap-southeast-1";
const USERS_TABLE = process.env.USERS_TABLE ?? "battleships-users";

const client = new DynamoDBClient({
    region: REGION,
    endpoint: ENDPOINT,
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
});

const tables = [
    {
        TableName: USERS_TABLE,
        BillingMode: "PAY_PER_REQUEST",
        AttributeDefinitions: [
            { AttributeName: "username", AttributeType: "S" },
            { AttributeName: "id", AttributeType: "S" },
        ],
        KeySchema: [{ AttributeName: "username", KeyType: "HASH" }],
        GlobalSecondaryIndexes: [
            {
                IndexName: "id-index",
                KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
                Projection: { ProjectionType: "ALL" },
            },
        ],
    },
];

async function waitForDynamo(attempts = 20, delayMs = 500) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return (await client.send(new ListTablesCommand({}))).TableNames ?? [];
        } catch (err) {
            if (attempt === attempts) {
                throw new Error(`DynamoDB Local not reachable at ${ENDPOINT} after ${attempts} attempts: ${err}`);
            }
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    return [];
}

async function createTables() {
    const existing = await waitForDynamo();

    for (const table of tables) {
        if (existing.includes(table.TableName)) {
            console.log(`✓ ${table.TableName} already exists`);
            continue;
        }

        await client.send(new CreateTableCommand(table));
        console.log(`+ created ${table.TableName}`);
    }
}

createTables().catch((err) => {
    console.error(err);
    process.exit(1);
});
