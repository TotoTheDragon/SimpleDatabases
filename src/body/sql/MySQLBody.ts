import { AbstractDatabase } from "../../databases/AbstractDatabase";
import { SerializedData } from "../../objects/SerializedData";
import { AbstractStorage } from "../../storage/AbstractStorage";
import { ColumnType } from "../../util/Constants";
import { AbstractBody } from "../AbstractBody";

export abstract class MySQLBody extends AbstractBody {

    database: AbstractDatabase;

    cache: SerializedData;

    constructor(storage: AbstractStorage<MySQLBody>, database: AbstractDatabase) {
        super(storage);
        this.database = database;
    }

    remove(): Promise<void> {
        return this.database.removeObject(this);
    }

    save(): Promise<void> {
        return this.database.saveObject(this);
    }

    abstract getCollection(): string;
    abstract getIdentifier(): string | string[];
    abstract getIdentifierValues(): string | string[];

    abstract getColumns(): Map<string, ColumnType>;

    getFields(): string[] {
        return Array.from(this.getColumns().keys());
    }

    /* SerializableObject */

    abstract serialize(data: SerializedData): void;

    abstract deserialize(data: SerializedData): void;
}