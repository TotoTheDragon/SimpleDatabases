import { Db, MongoClient, MongoClientOptions } from "mongodb";
import { MongoDBBody } from "../../body/nosql/MongoDBBody";
import { SerializedData } from "../../objects/SerializedData";
import { SDUtil } from "../../util/Util";
import { AbstractDatabase } from "../AbstractDatabase";


export class MongoDBDatabase extends AbstractDatabase {

    mongoClient: MongoClient;
    mongoDatabase: Db;

    collections: string[];

    database: string;
    uri: string;
    options: MongoClientOptions;

    constructor(database: string, uri: string, options?: MongoClientOptions) {
        super();
        this.database = database;
        this.uri = uri;
        this.options = options;
    }

    async connect(): Promise<void> {
        this.mongoClient = await MongoClient.connect(this.uri, this.options);
        this.mongoDatabase = this.mongoClient.db(this.database);
    }

    removeObject(obj: MongoDBBody): Promise<any> {
        return this.mongoDatabase.collection(obj.getCollection()).deleteOne(obj.getSelectorFromCache() || obj.getSelector());
    }

    async saveObject(obj: MongoDBBody): Promise<any> {
        return obj.cache ? this.updateObject(obj) : this.insertObject(obj);
    }

    async updateObject(obj: MongoDBBody): Promise<any> {
        const serialized = new SerializedData(obj).toJSON();
        const changed: string[] = obj.cache ? obj.getFields().filter(f => obj.cache.get(f, "json") != serialized[f]) : obj.getFields();
        if (changed.length <= 0) return;
        const setobj = {}
        for (const field of changed) setobj[field] = serialized[field];
        return this.mongoDatabase.collection(obj.getCollection()).updateOne(obj.getSelectorFromCache() || obj.getSelector(), { $set: setobj });
    }

    insertObject(obj: MongoDBBody): Promise<any> {
        const data = new SerializedData(obj);
        return this.mongoDatabase.collection(obj.getCollection()).insertOne(data.toJSON());
    }

    async selectObject(collection: string, selector: object): Promise<SerializedData> {
        const result: any = await this.mongoDatabase.collection(collection).findOne(selector);
        return result ? SerializedData.fromJSON(result) : undefined;
    }

    async getAllValues(collection: string): Promise<SerializedData[]> {
        const results: any[] = SDUtil.makeArray(await this.mongoDatabase.collection(collection).find({}));
        return results.map(r => SerializedData.fromJSON(r));
    }
}