import { FlatFileDatabase } from "../../databases/other/FlatFileDatabase";
import { SerializedData } from "../../objects/SerializedData";
import { AbstractStorage } from "../../storage/AbstractStorage";
import { AbstractBody } from "../AbstractBody";

export abstract class FlatFileBody extends AbstractBody {

    database: FlatFileDatabase;

    constructor(storage: AbstractStorage<FlatFileBody>, database: FlatFileDatabase) {
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

    abstract getCollection(): string;
    abstract getIdentifier(): string;
    abstract getIdentifierValues(): string;
    abstract getFields(): string[];

    /* SerializableObject */

    abstract serialize(data: SerializedData): void;

    abstract deserialize(data: SerializedData): void;
}