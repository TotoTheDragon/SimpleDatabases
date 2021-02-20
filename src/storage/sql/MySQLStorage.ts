import { MySQLBody } from "../../body/sql/MySQLBody";
import { MySQLDatabase, MySQLTableCreator, MySQLTableEditor } from "../../databases/sql/MySQLDatabase";
import { SerializedData } from "../../objects/SerializedData";
import { StorageHolder } from "../../StorageHolder";
import { ColumnType } from "../../util/Constants";
import { SDUtil } from "../../util/Util";
import { AbstractStorage } from "../AbstractStorage";

export abstract class MySQLStorage<T extends MySQLBody> extends AbstractStorage<MySQLBody> {

    db: MySQLDatabase;


    constructor(holder: StorageHolder, database: MySQLDatabase, prototype: any) {
        super(holder, prototype);
        this.db = database;
    }

    getDummy(): T {
        return new this._holds(this, this.db);
    }

    async setup(): Promise<void> {

        await this.db.fetchTables();

        const dummy = this.getDummy();
        const supposed: Map<string, any> = dummy.getColumns();
        supposed.forEach((v, k) => supposed.set(k, SDUtil.fromColumnType(v))); // Make sure the value is the actual string version of the column type

        if (this.db.tables.includes(dummy.getCollection())) { // The table already exists. Check if it needs to be edited
            const current: Map<string, any> = await this.db.getColumns(dummy.getCollection());
            current.forEach((v, k) => current.set(k, SDUtil.fromColumnType(v))); // Make sure the value is the actual string version of the column type
            if (SDUtil.isSameMap(current, supposed)) return; // If these maps are the same, no changes were made

            const editor: MySQLTableEditor = new MySQLTableEditor(dummy.getCollection());

            return editor.edit(this.db, current, supposed);
        }

        const creator: MySQLTableCreator = new MySQLTableCreator(dummy.getCollection());

        return creator.create(this.db, supposed);
    }

    abstract onRemove(object: T): Promise<void>;

    abstract onAdd(object: T): Promise<void>;

    async getOrCreate(identifiers: object): Promise<T> {
        return this.cache(identifiers, true);
    }

    async cache(identifiers: object, createIfNotExists?: boolean): Promise<T> {
        const obj: T = this.getDummy();
        Object.keys(identifiers).forEach(i => obj[i] = identifiers[i]);

        const serialized = await this.db.selectObject(obj.getCollection(), obj.getIdentifier(), obj.getIdentifierValues());
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