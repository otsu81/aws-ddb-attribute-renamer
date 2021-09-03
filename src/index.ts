import { AttributeValue, BatchWriteItemCommand, BatchWriteItemCommandInput, BatchWriteItemCommandOutput, DynamoDBClient, PutItemCommand, PutRequest, ScanCommand, ScanCommandInput, ScanInput, WriteRequest } from "@aws-sdk/client-dynamodb";
import { marshall,unmarshall } from '@aws-sdk/util-dynamodb';
import { chunk, isEmpty, random, update } from "lodash";
import * as crypto from "crypto";
import { start } from "repl";
import { PassThrough } from "stream";
import * as readline from 'readline';

const ddb = new DynamoDBClient({ region: 'eu-north-1' });
let counter = 0;

interface Item {
    [key:string]: {} | undefined
}

function timer(ms:number) {
    return new Promise( res => setTimeout(res, ms))
}

function randomHex(length: number): string {
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

    // console.log(JSON.stringify(response, null, 2), "\n-------------------------");
    if (!isEmpty(response.LastEvaluatedKey)) {
        await renameAttribute(table, oldAttr, newAttr, true, response.LastEvaluatedKey)
    }
}

// async function sendSingleBatchWithBackoff(table: string, params: BatchWriteItemCommandInput, retries: number = 0): Promise<BatchWriteItemCommandOutput> {
// async function sendSingleBatchWithBackoff(table: string, params: BatchWriteItemCommandInput, retries: number = 0) {
//     try {
//         return ddb.send(new BatchWriteItemCommand(params));
//     } catch (e) {
//         console.log(typeof e);
//         throw new RetryError('poop');
//     //     if (e instanceof Error) {
//     //         if (e.errorType === 'ThrottlingException' && retries < 6) {
//     //             const delay:number = random(500 * 2 ** retries);
//     //             console.log(`Throttled sending batch, attempt ${retries}, sleeping ${delay}`)
//     //             await timer(delay); // linear backoff + jitter
//     //             return sendSingleBatchWithBackoff(table, params, retries);
//     //         } else {
//     //             throw new Error(e.errorMessage);
//     //         }

//     //     }
//     }
// }

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
        process.stdout.write(`sending batch ${counter}`)

        promises.push(ddb.send(new BatchWriteItemCommand(params)));
        // promises.push(sendSingleBatchWithBackoff(table, params))
        if (counter % concurrentBatches == 0) {
            await timer(500 - (Date.now() - timestamp));
            timestamp = Date.now();
        };
    };

    const response = await Promise.allSettled(promises);
    for (let r of response) {
        if (r.status === 'rejected') console.log(r);
    };
    // for (let r of response) {
    //     if (!isEmpty(r.UnprocessedItems)) {
    //         let unpItems:PutRequest[] = [];
    //         for (let unp of r.UnprocessedItems[table]) {
    //             console.log(unp.PutRequest)
    //             unpItems.push(unp.PutRequest);
    //         };

    //     };
    // }

    // if (!isEmpty(response.UnprocessedItems)) console.log(JSON.stringify(response.UnprocessedItems, null, 2));
    return response;
};

async function makeMock() {

    let items = makeMockItems(100000);
    const table = 'cafzg3-lab';

    try {
        batchWrite(table, items).then(response => {
            // for (let r of response) {
            //     if (!isEmpty(r.UnprocessedItems)) {
            //         for (let pr of r.UnprocessedItems[table]) {
            //             console.log(JSON.stringify(pr.PutRequest));
            //         }
            //     };
            // };
        });
        return 'done';
    } catch (e) {
        throw new Error('broken');
    }
};

// populateDdb('cafzg3-lab').then( result => console.log(result))
// makeMock().then();

// const v = {
//     index: {
//       S: "9681"
//     }
// }

const timestamp = Date.now()
renameAttribute('cafzg3-lab', 'newVal', 'val', true).then(res =>
    console.log(`\nApprox ${counter * 25} items processed in  ${Date.now() - timestamp} ms`)
);