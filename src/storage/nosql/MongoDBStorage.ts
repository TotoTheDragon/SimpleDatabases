import { MongoDBBody } from "../../body/nosql/MongoDBBody";
import { MongoDBDatabase } from "../../databases/nosql/MongoDBDatabase";
import { SerializedData } from "../../objects/SerializedData";
import { StorageHolder } from "../../StorageHolder";
import { AbstractStorage } from "../AbstractStorage";

export abstract class MongoDBStorage<T extends MongoDBBody> extends AbstractStorage<MongoDBBody> {

    db: MongoDBDatabase;


    constructor(holder: StorageHolder, database: MongoDBDatabase, prototype: any) {
        super(holder, prototype);
        this.db = database;
    }

    getDummy(): T {
        return new this._holds(this, this.db);
    }

    async setup(): Promise<void> {
        return;
    }

    abstract onRemove(object: T): Promise<void>;

    abstract onAdd(object: T): Promise<void>;

    async getOrCreate(identifiers: object): Promise<T> {
        return this.cache(identifiers, true);
    }

    abstract getFromCached(identifiers: object): T;

    async cache(identifiers: object, createIfNotExists?: boolean): Promise<T> {
        const cached = this.getFromCached(identifiers);
        if (cached) return cached;

        const obj: T = this.getDummy();
        Object.keys(identifiers).forEach(i => obj[i] = identifiers[i]);

        const serialized = await this.db.selectObject(obj.getCollection(), obj.getSelectorFromCache() || obj.getSelector());
        if (serialized) {
            const o = this.deserialize(obj, serialized);
            this.onAdd(o);
            return o;
        }

        if (createIfNotExists) {
            await obj.save();
            obj.cache = new SerializedData(obj);
            this.onAdd(obj);
            return obj;
        }

        return null;
    }

    fromSerializedData(data: SerializedData): T {
        return this.deserialize(this.getDummy(), data);
    }

    deserialize(object: T, data: SerializedData): T {
        if (!object) return undefined;
        object.cache = data;
        object.deserialize(data);
        return object;
    }

    async load(): Promise<void> {
        (await this.db.getAllValues(this.getDummy().getCollection()))
            .map(data => this.fromSerializedData(data))
            .forEach(obj => this.onAdd(obj));
        return;
    }

    abstract getValues(): T[];

}