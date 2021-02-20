import { MongoDBDatabase } from "../../databases/nosql/MongoDBDatabase";
import { SerializedData } from "../../objects/SerializedData";
import { AbstractStorage } from "../../storage/AbstractStorage";
import { SDUtil } from "../../util/Util";
import { AbstractBody } from "../AbstractBody";

export abstract class MongoDBBody extends AbstractBody {

    database: MongoDBDatabase;

    cache: SerializedData;

    constructor(storage: AbstractStorage<MongoDBBody>, database: MongoDBDatabase) {
        super(storage);
        this.database = database;
    }

    async remove(): Promise<void> {
        await this.storage.onRemove(this);
        return this.database.removeObject(this);
    }

    async save(): Promise<void> {
        await this.storage.onAdd(this);
        return this.database.saveObject(this);
    }

    getSelector(): object {
        const selector = {};
        const identifiers = SDUtil.makeArray(this.getIdentifier());
        const values = SDUtil.makeArray(this.getIdentifierValues());
        for (let i = 0; i < identifiers.length; i++) selector[identifiers[i]] = values[i];
        return selector;
    }

    getSelectorFromCache(): object {
        if (!this.cache) return undefined;
        const selector = {};
        const identifiers = SDUtil.makeArray(this.getIdentifier());
        const cache = this.cache.toJSON();
        for (let i = 0; i < identifiers.length; i++) selector[identifiers[i]] = cache[identifiers[i]];
        return selector;
    }

    abstract getCollection(): string;
    abstract getIdentifier(): string | string[];
    abstract getIdentifierValues(): string | string[];
    abstract getFields(): string[];

    /* SerializableObject */

    abstract serialize(data: SerializedData): void;

    abstract deserialize(data: SerializedData): void;
}