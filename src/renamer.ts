import { BatchWriteItemCommand, DynamoDBClient, ScanCommand, ScanCommandInput } from "@aws-sdk/client-dynamodb";
import { chunk, isEmpty } from "lodash";
import { exit } from 'process';
import * as readline from 'readline';
import minimist from 'minimist'

let counter = 0;
let retries = 0;

interface Item {
    [key:string]: {} | undefined
}

function timer(ms:number) {
    return new Promise( res => setTimeout(res, ms))
}

function makeItemsFromList(items:Item[]) {
    const ddbItems = [];
    for (let item of items) {
        ddbItems.push({
            PutRequest: {
                Item: item
            }
        })
    };
    return ddbItems;
}

function changeAttributesonAll(items:Item[], oldAttr:string, newAttr:string, del:boolean) {
    const newItems = [];
    for (let item of items) {
        let newItem:Item = {};
        Object.assign(newItem, item, { [newAttr]: item[oldAttr] })

        if (del) delete newItem[oldAttr];

        newItems.push(newItem);
    }

    return newItems;
}

async function renameAttribute(table: string, oldAttr: string, newAttr: string, del: boolean, startKey?:{}) {
    let params:ScanCommandInput = {
        TableName: table,
        Limit: 1000,
        ExpressionAttributeNames: {"#v": oldAttr},
        FilterExpression: 'attribute_exists(#v)',
        ExclusiveStartKey: startKey
    };

    if (!isEmpty(startKey)) {
        params = {...params, ExclusiveStartKey: startKey};
    };

    let response = await ddb.send(new ScanCommand(params));

    if (!isEmpty(response.Items)) {
        const updatedItems = changeAttributesonAll(response.Items as Item[], oldAttr, newAttr, true);
        const ddbItems = makeItemsFromList(updatedItems);
        await batchWrite(table, ddbItems);
    };

    if (!isEmpty(response.LastEvaluatedKey)) {
        await renameAttribute(table, oldAttr, newAttr, true, response.LastEvaluatedKey)
    }
}

async function batchWrite(table:string, items:{}[]) {

    let batches = chunk(items, 25); // max size for DDB chunk is 25
    const promises = [];

    let timestamp = Date.now();

    // set a limit to nbr of batches to avoid throttling
    const concurrentBatches = 100;
    for (let batch of batches) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        counter++;
        let params = {
            RequestItems: {
                [table]: batch
            }
        };
        process.stdout.write(`sending batch ${counter}, retries ${retries}`)

        promises.push(ddb.send(new BatchWriteItemCommand(params)));
        if (counter % concurrentBatches == 0) {
            await timer(500 - (Date.now() - timestamp));
            timestamp = Date.now();
        };
    };

    let unprocessed = new Array;
    const response = await Promise.allSettled(promises);
    for (let r of response) {
        if (r.status === 'rejected') console.log(r);
        if (!isEmpty(r.value.UnprocessedItems)) {
            for (let unpr of r.value.UnprocessedItems[table]) unprocessed.push(unpr);
        };
    };

    if (!isEmpty(unprocessed)) {
        retries++;

        await batchWrite(table, unprocessed);
    };
};


let argv = minimist(process.argv.slice(2))

const args = ['table', 'region', 'old_attribute', 'new_attribute', 'delete_old_attribute'];
const usgMsg = 'Usage: \tnode renamer --table [table_name] --region [aws_region] --old_attribute [value] --new_attribute [value] --delete_old_attribute [true|false]\n`';

for (let r of args) {
  if (!argv[r]) {
    console.log(`Required argument --${r} missing\n${usgMsg}`);
    exit(1);
  };
};
if (argv.delete_old_attribute !== ('true' || 'false')) {
  console.log(`Incorret argument for --delete_old_attribute, must be either true or false\n${usgMsg}`);
  exit(1);
};

const ddb = new DynamoDBClient({ region: argv.region });
const timestamp = Date.now()
renameAttribute(argv.table, argv.old_attribute, argv.new_attribute, argv.delete_old_attribute).then(res =>
    console.log(`\nApprox ${counter * 25} items processed in  ${Date.now() - timestamp} ms`)
);
