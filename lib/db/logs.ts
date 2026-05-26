import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, getDynamoTableName, isDynamoDbConfigured } from "@/lib/db/dynamodb";
import type { SearchSource } from "@/lib/types/search";

export type { SearchSource };

export type SearchLog = {
  logId: string;
  userId: string;
  query: string;
  answer: string;
  sources: SearchSource[];
  createdAt: string;
};

export type SaveSearchLogInput = {
  query: string;
  answer: string;
  sources: SearchSource[];
};

function createLogId(): string {
  return `LOG#${new Date().toISOString()}`;
}

export async function saveSearchLog(
  userId: string,
  input: SaveSearchLogInput,
): Promise<SearchLog | null> {
  if (!isDynamoDbConfigured()) {
    return null;
  }

  const log: SearchLog = {
    logId: createLogId(),
    userId,
    query: input.query,
    answer: input.answer,
    sources: input.sources,
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: getDynamoTableName(),
      Item: log,
    }),
  );

  return log;
}

export async function listSearchLogs(
  userId: string,
  limit = 50,
): Promise<SearchLog[]> {
  if (!isDynamoDbConfigured()) {
    return [];
  }

  const result = await docClient.send(
    new QueryCommand({
      TableName: getDynamoTableName(),
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ScanIndexForward: false,
      Limit: limit,
    }),
  );

  return (result.Items as SearchLog[] | undefined) ?? [];
}
