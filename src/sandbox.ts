// import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

import { random } from "lodash";

// async function scan() {
//   const ddb = new DynamoDBClient({region: 'eu-north-1'});
//   const val = 'newVal'
//   const result = await ddb.send(new ScanCommand({
//     TableName: 'cafzg3-lab',
//     // Limit: 10,
//     ExpressionAttributeNames: {"#v": val},
//     FilterExpression: 'attribute_exists(#v)'
//   }));

//   console.log(result);
// }

// function timer2(ms:number) {
//   return new Promise( res => setTimeout(res, ms))
// }


// async function run() {
//   for (let i = 1; i < 6; i++) {
//     console.log(`${i}...`)
//     await timer2(1000);
//   }
// }

// run().then();

for (let i = 1; i < 6; i++) {
  let someNumber:number = random(500 * 2 ** i);
  console.log(i, ': ', someNumber);
}