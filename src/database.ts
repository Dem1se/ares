import { MongoClient, Db } from 'mongodb'

export class DBClient {
    client: MongoClient;
    private db: Db | undefined;

    constructor() {
        if (!process.env.ATLAS_URI) {
            console.error(`ATLAS_URI not in .env! Exiting...`)
            process.exit(2)
        }
        this.client = new MongoClient(process.env.ATLAS_URI)
        this.client.connect((err, conn) => {
            if (err || !conn) {
                console.error('Error connecting to database. Hint: Check if the IP is allowed network acess in cluster config.')
                console.error(err)
                process.exit(3)
            }
            if (!process.env.DB_NAME) {
                console.error(`DB_NAME not in .env! Exiting...`)
                process.exit(2)
            }
            this.db = this.client.db(process.env.DB_NAME)
        })
    }

    getDb(): Db {
        if (!this.db) {
            this.db = this.client.db(process.env.DB_NAME)
        }
        return this.db;
    }
}