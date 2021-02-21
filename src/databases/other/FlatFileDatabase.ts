import { readFile, unlink, writeFile } from "fs/promises";
import { MongoClient } from "mongodb";
import { MongoDBBody } from "../../body/nosql/MongoDBBody";
import { FlatFileBody } from "../../body/other/FlatFileBody";
import { SerializedData } from "../../objects/SerializedData";
import { SDUtil } from "../../util/Util";
import { AbstractDatabase } from "../AbstractDatabase";


export class FlatFileDatabase extends AbstractDatabase {

    basePath: string;

    constructor(path?: string) {
        super();
        this.basePath = (path || SDUtil.getExecutionPath()) + "/";
    }

    async connect(): Promise<void> { }

    async removeObject(obj: FlatFileBody): Promise<any> {
        return unlink(this.basePath + obj.getCollection() + "/" + obj.getIdentifierValues() + ".json");
    }

    async saveObject(obj: FlatFileBody): Promise<any> {
        return writeFile(this.basePath + obj.getCollection() + "/" + obj.getIdentifierValues() + ".json", JSON.stringify(new SerializedData(obj).toJSON(), null, 2));
    }

    async updateObject(obj: FlatFileBody): Promise<any> {
        return this.saveObject(obj);
    }

    insertObject(obj: FlatFileBody): Promise<any> {
        return this.saveObject(obj);
    }

    async selectObject(collection: string, identifier: string): Promise<SerializedData> {
        try {
            const data = await readFile(this.basePath + collection + "/" + identifier + ".json");
            return SerializedData.fromJSON(JSON.parse(data.toString()));
        } catch {
            return undefined;
        }
    }

    async getAllValues(collection: string): Promise<SerializedData[]> {
        const files: string[] = await SDUtil.findFiles(this.basePath + collection);
        let result: SerializedData[] = [];

        for (const file of files) {
            try {
                const data = await readFile(this.basePath + collection + "/" + file);
                result.push(SerializedData.fromJSON(JSON.parse(data.toString())));
            } catch { }
        }

        return result;
    }
}