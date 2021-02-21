import { mkdir } from "fs/promises";
import { FlatFileBody } from "../../body/other/FlatFileBody";
import { FlatFileDatabase } from "../../databases/other/FlatFileDatabase";
import { SerializedData } from "../../objects/SerializedData";
import { StorageHolder } from "../../StorageHolder";
import { AbstractStorage } from "../AbstractStorage";

export abstract class FlatFileStorage<T extends FlatFileBody> extends AbstractStorage<FlatFileBody> {

    db: FlatFileDatabase;

    constructor(holder: StorageHolder, database: FlatFileDatabase, prototype: any) {
        super(holder, prototype);
        this.db = database;
    }

    getDummy(): T {
        return new this._holds(this, this.db);
    }

    async setup(): Promise<any> {
        return mkdir(this.db.basePath + this.getDummy().getCollection(), { recursive: true });
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

        const serialized = await this.db.selectObject(obj.getCollection(), obj.getIdentifierValues());
        if (serialized) {
            obj.deserialize(serialized);
            this.onAdd(obj);
            return obj;
        }

        if (createIfNotExists) {
            await obj.save();
            this.onAdd(obj);
            return obj;
        }

        return null;
    }

    fromSerializedData(data: SerializedData): T {
        const obj = this.getDummy();
        obj.deserialize(data);
        return obj;
    }

    async load(): Promise<void> {
        (await this.db.getAllValues(this.getDummy().getCollection()))
            .map(data => this.fromSerializedData(data))
            .forEach(obj => this.onAdd(obj));
        return;
    }

    abstract getValues(): T[];

}