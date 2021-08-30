import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { chunk } from "lodash"


function makeBatch() {
    let array = []
    for (let i = 0; i < 100; i++) {
        array.push(i)
    }

    const chunks = chunk(array, 25)

    console.log(chunks)

}

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

// populateDdb('cafzg3-lab').then( result => console.log(result))
makeBatch()