import { BatchWriteItemCommand, DynamoDBClient, PutItemCommand, PutRequest, WriteRequest } from "@aws-sdk/client-dynamodb";
import { chunk, isEmpty } from "lodash";
import * as crypto from "crypto";

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

async function batchWrite(table: string, items: object[]) {
    const ddb = new DynamoDBClient({ region: 'eu-north-1' });

    let batches = chunk(items, 25);

    const promises = [];
    for (let batch of batches) {
        let params = {
            RequestItems: {
                [table]: batch
            }
        };
        promises.push(ddb.send(new BatchWriteItemCommand(params)));
    };

    const response = await Promise.all(promises);
    return response;
};

async function populateDdb(table: string) {
    const ddb = new DynamoDBClient({ region: 'eu-north-1' })
    const response = await ddb.send(new PutItemCommand(
        {
            TableName: table,
            Item: {
                index: {
                    'S': 'hello'
                },
                val: {
                    'S': 'world3'
                }
            }
        }
    ))
    return response
}

async function run() {

    let items = makeMockItems(5000);

    try {
        await batchWrite('cafzg3-lab', items).then(response => {
            for (let r of response) {
                if (!isEmpty(r.UnprocessedItems)) console.log(r.UnprocessedItems);

            };
        });
        return 'done';
    } catch (e) {
        throw new Error(e);
    }
};

// populateDdb('cafzg3-lab').then( result => console.log(result))
// makeBatch()
run().then(result => console.log(result));