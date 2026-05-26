import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import { getDynamoTableName } from "../lib/config/models";

async function main() {
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION ?? "ap-northeast-1",
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });

  const tableName = getDynamoTableName();

  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`Table "${tableName}" already exists.`);
    return;
  } catch {
    // create table
  }

  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      BillingMode: "PAY_PER_REQUEST",
      AttributeDefinitions: [
        { AttributeName: "userId", AttributeType: "S" },
        { AttributeName: "logId", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "userId", KeyType: "HASH" },
        { AttributeName: "logId", KeyType: "RANGE" },
      ],
    }),
  );

  console.log(`Created table "${tableName}".`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
