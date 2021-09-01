import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

async function scan() {
  const ddb = new DynamoDBClient({region: 'eu-north-1'});
  const val = 'newVal'
  const result = await ddb.send(new ScanCommand({
    TableName: 'cafzg3-lab',
    // Limit: 10,
    ExpressionAttributeNames: {"#v": val},
    FilterExpression: 'attribute_exists(#v)'
  }));

  console.log(result);
}

scan().then();