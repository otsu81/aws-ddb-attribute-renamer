// async function populateDdb(table: string) {
//   const ddb = new DynamoDBClient({ region: 'eu-north-1' })
//   const response = await ddb.send(new PutItemCommand(
//       {
//           TableName: table,
//           Item: {
//               index: {
//                   'S': 'hello'
//               },
//               val: {
//                   'S': 'world3'
//               }
//           }
//       }
//   ))
//   return response
// }