import { SqlDataBody } from "../body/SqlDataBody";
import { SerializedData } from "../SerializedData";
import { SQLWrapper } from "../sql/SQLWrapper";
import { TableCreator } from "../sql/TableCreator";
import { TableEditor } from "../sql/TableEditor";
import { StorageHolder } from "../StorageHolder";
import { Storage } from "./Storage";

export abstract class SqlStorage<T extends SqlDataBody> extends Storage<T> {

    database: SQLWrapper;

    constructor(holder: StorageHolder, db: SQLWrapper) {
        super(holder);
        this.database = db;
    }

    add = (object: T): Promise<void> => new Promise(
        async resolve => {
            this.onAdd(object);
            await this.saveObject(object);
            resolve();
        });

    remove = (object: T): Promise<void> => new Promise(
        async resolve => {
            this.onRemove(object);
            await this.database.remove(object.getTable(), object.getKey(), object.getStructure());
            resolve();
        });


    cache = (primaryKey: any, callback?: (arg: T) => any): Promise<T> => new Promise(
        async resolve => {
            const data: SerializedData = await this.database.getFirstResult(this.getDummy().getStructure()[0], primaryKey, this.getDummy().getTable());
            const t: T = this.getDummy();
            t.deserialize(data);
            this.onAdd(t);
            resolve(t);
        });

    cacheAll = (key: string, value: string, callback?: (arg: any) => any): Promise<T[]> => new Promise(
        async resolve => {
            const dataset: SerializedData[] = await this.database.getAllResults(key, value, this.getDummy().getTable());
            const ts = [];
            for (const data of dataset) {
                const t: T = this.getDummy();
                t.deserialize(data);
                ts.push(t);
                this.onAdd(t);
            }
            resolve(ts);
        });

    saveObject = (object: T, callback?: () => void, prepare: boolean = true): Promise<void> => new Promise(
        async resolve => {
            if (prepare) await this.prepareTable(object);
            const data: SerializedData = new SerializedData();
            object.serialize(data);

            if (await this.database.isPrimaryKeyUsed(object.getTable(), object.getKey(), object.getStructure()))
                await this.updateObject(object, object.getKey());
            else
                await this.insertObject(object, object.getKey());

            if (callback) callback();
            resolve();
        })


    save = (callback?: () => any): Promise<void> => new Promise(
        async resolve => {
            let first = true;
            let promises = [];
            for (const databody of this) {
                if (first) {
                    first = false;
                    promises.push(this.saveObject(databody, callback, true));
                }
                else promises.push(this.saveObject(databody, callback, false));
            }
            await Promise.all(promises);
            resolve();
        });

    load = (callback?: () => any): Promise<void> => new Promise(
        async resolve => {
            const dummy: T = this.getDummy();
            const values: SerializedData[] = await this.database.getAllValuesOf(dummy.getTable(), dummy.getStructure());

            for (const data of values) {
                const t: T = this.getDummy();
                t.deserialize(data);
                this.onAdd(t);
            }
            if (callback) callback();
            resolve();
        })


    prepareTable = (object: T): Promise<void> => new Promise(
        async resolve => {
            const tables = await this.database.getTables();
            if (tables.includes(object.getTable())) await this.updateTable(object, this.database);
            else await this.insertTable(object, this.database);
            resolve();
        });


    updateObject = (object: T, primaryKey: string): Promise<void> => new Promise(
        async resolve => {
            const data: SerializedData = new SerializedData();
            object.serialize(data);

            const values = object.getStructure()
                .slice(1)
                .filter(col => data.applyAs(col) != undefined)
                .map(col => `${col} = '${data.applyAs<string>(col)}'`)
                .join(",")
                .replace(new RegExp(`'null'`, "g"), "NULL");

            let sql = `UPDATE ${object.getTable()} SET ${values} WHERE ${object.getStructure()[0]} = '${primaryKey}'`;
            await this.database.execute(sql);
            resolve();
        });

    insertObject = (object: T, primaryKey: string): Promise<void> => new Promise(
        async resolve => {
            const data: SerializedData = new SerializedData();
            object.serialize(data);
            let values = object.getStructure()
                .map(col => data.applyAs<string>(col))
                .join("','")
                .replace(new RegExp(`"`, "g"), `\\"`);
            let sql = `INSERT INTO ${object.getTable()} (${object.getStructure().join(",")}) VALUES('${values}')`;
            await this.database.execute(sql);
            resolve();
        });


    updateTable = (object: T, database: SQLWrapper): Promise<void> => new Promise(
        async resolve => {
            const columns: string[] = await database.getColumns(object.getTable());

            const editor: TableEditor = new TableEditor(object.getTable());

            object.getStructure()
                .filter(s => !columns.includes(s))
                .forEach(s => editor.addColumn(s, "TEXT"));
            await editor.edit(database);
            resolve();
        });


    insertTable = (object: T, database: SQLWrapper): Promise<void> => new Promise(
        async resolve => {
            const creator: TableCreator = database
                .newTableCreator()
                .setName(object.getTable())
                .primaryKey(object.getStructure()[0], "VARCHAR(255)");

            for (const col of object.getStructure().slice(1))
                creator.addColumn(col, "TEXT");

            await creator.create();
            resolve();
        });


    abstract getDummy(): T;
    abstract onAdd(object: T): void;
    abstract onRemove(object: T): void;
    abstract [Symbol.iterator](): Iterator<T, any, undefined>;

}