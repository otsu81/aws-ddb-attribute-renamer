import { AttributeValue, BatchWriteItemCommand, DynamoDBClient, PutItemCommand, PutRequest, ScanCommand, ScanCommandInput, ScanInput, WriteRequest } from "@aws-sdk/client-dynamodb";
import { marshall,unmarshall } from '@aws-sdk/util-dynamodb';
import { chunk, isEmpty, update } from "lodash";
import * as crypto from "crypto";
import { start } from "repl";
import { PassThrough } from "stream";

const timer = ms => new Promise( res => setTimeout(res, ms));

const ddb = new DynamoDBClient({ region: 'eu-north-1' });

function randomHex(length: number) {
    return crypto.randomBytes(length).toString('hex');
}

function makeMockItems(nbr: number) {
    const items = [];
    for (let i = 0; i < nbr; i++) {
        items.push({
            PutRequest: {
                Item: {
                    index: { S: i.toString() },
                    val: { S: randomHex(20) }
                }
            }
        })
    };
    return items;
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

    console.log(ddbItems);

    return ddbItems;
}

function changeAttributesonAll(items:[object], oldAttr:string, newAttr:string, del:boolean) {
    interface Item {
        [key:string]: Object | undefined
    }

    const newItems = [];
    for (let item of items) {
        let newItem:Item = {};
        Object.assign(newItem, item, { [newAttr]: item[oldAttr] })

        if (del) delete newItem[oldAttr];

        newItems.push(newItem);
    }

    return newItems;
}

async function scan(table: string, oldAttr:string, newAttr:string, del:boolean, startKey:object = {}) {

    let params:object = {
        TableName: table,
        Limit: 1000,
        ExpressionAttributeNames: {"#v": oldAttr},
        FilterExpression: 'attribute_exists(#v)'
    }
    if (!isEmpty(startKey)) {
        params = {...params, ExclusiveStartKey: startKey};
    }

    let scanInput:ScanCommandInput = {...params};
    let response = await ddb.send(new ScanCommand(scanInput));

    if (!isEmpty(response.Items)) {
        const updatedItems = changeAttributesonAll(response.Items, oldAttr, newAttr, true);
        const ddbItems = makeItemsFromList(updatedItems);
        await batchWrite(table, ddbItems);
    }

    // console.log(JSON.stringify(response, null, 2), "\n-------------------------");
    if (!isEmpty(response.LastEvaluatedKey)) {
        await scan(table, oldAttr, newAttr, true, response.LastEvaluatedKey)
    }
}

async function batchWrite(table:string, items:object[]) {

    let batches = chunk(items, 25);

    const promises = [];

    // set a limit to nbr of batches
    let timestamp = Date.now();
    let counter = 0;
    const concurrentBatches = 100;
    for (let batch of batches) {
        counter++;
        let params = {
            RequestItems: {
                [table]: batch
            }
        };
        console.log(`sending batch ${counter}`)

        promises.push(ddb.send(new BatchWriteItemCommand(params)));
        if (counter % concurrentBatches == 0) {
            await timer(1000 - (Date.now() - timestamp));
            timestamp = Date.now();
        };
    };

    const response = await Promise.all(promises);
    return response;
};

async function run() {

    let items = makeMockItems(10000);
    const table = 'cafzg3-lab';

    try {
        await batchWrite(table, items).then(response => {
            for (let r of response) {
                if (!isEmpty(r.UnprocessedItems)) {
                    for (let pr of r.UnprocessedItems[table]) {
                        console.log(JSON.stringify(pr.PutRequest));
                    }
                };
            };
        });
        return 'done';
    } catch (e) {
        throw new Error(e);
    }
};

// populateDdb('cafzg3-lab').then( result => console.log(result))
// makeBatch()
// run().then(result => console.log(result))

// const v = {
//     index: {
//       S: "9681"
//     }
// }

scan('cafzg3-lab', 'val', 'newerVal', true).then();