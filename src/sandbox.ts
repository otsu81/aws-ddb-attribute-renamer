// import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
// import { random } from "lodash";

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

// for (let i = 1; i < 6; i++) {
//   let someNumber:number = random(500 * 2 ** i);
//   console.log(i, ': ', someNumber);
// }

import { symlinkSync } from 'fs';
import minimist from 'minimist'
import { exit } from 'process';
import { getSystemErrorMap } from 'util';

let argv = minimist(process.argv.slice(2))

const args = ['table', 'region', 'old_attribute', 'new_attribute', 'delete_old_attribute'];
const usgMsg = '\tUsage: \tnode renamer --table [table_name] --region [aws_region] --old_attribute [value] --new_attribute [value] --delete_old_attribute [true|false]\n`';

for (let r of args) {
  if (!argv[r]) {
    console.log(`Required argument --${r} missing\n\n${usgMsg}`);
    exit(1);
  };
};

if (argv.delete_old_attribute !== ('true' || 'false')) {
  console.log(`Incorret argument for --delete_old_attribute, must be either true or false\n${usgMsg}`);
};