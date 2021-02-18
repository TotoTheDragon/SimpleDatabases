import { SqlDataBody } from "../body/SqlDataBody";
import { SerializedData } from "../SerializedData";
import { SQLWrapper } from "../sql/SQLWrapper";
import { TableCreator } from "../sql/TableCreator";
import { TableEditor } from "../sql/TableEditor";
import { StorageHolder } from "../StorageHolder";
import { toArray } from "../StringUtil";
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
            await this.database.remove(object.getTable(), object.getKey(), object.getValues());
            resolve();
        });


    cache = (key: string | string[], value: string | string[], createIfNotExists: boolean = true, callback?: (arg: T) => any): Promise<T> => new Promise(
        async resolve => {
            const t: T = this.getDummy();
            let data: SerializedData = await this.database.getFirstResult(key, value, t.getTable());
            if (data !== undefined) {
                t.deserialize(data);
                this.onAdd(t);
                return resolve(t);
            }
            if (!createIfNotExists) return resolve(undefined);
            const values = toArray(value);
            const obj = {};
            toArray(key).forEach((k, i) => obj[k] = values[i]);
            data = new SerializedData(obj);
            t.deserialize(data);
            await this.add(t);
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

            if (await this.database.isKeyUsed(object.getTable(), object.getKey(), object.getValues()))
                await this.updateObject(object, object.getKey(), object.getValues());
            else
                await this.insertObject(object);

            if (callback) callback();
            resolve();
        })


    save = (callback?: () => any): Promise<void> => new Promise(
        async resolve => {
            let first = true;
            let promises = [];
            for (const databody of this.getValues()) {
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


    updateObject = (object: T, key: string | string[], value: string | string[]): Promise<void> => new Promise(
        async resolve => {
            const keys = toArray(key);
            const values = toArray(value);

            const data: SerializedData = new SerializedData();
            object.serialize(data);

            const columns = object.getStructure()
                .filter(col => !keys.includes(col))
                .filter(col => data.applyAs(col) !== undefined);

            const unknownValues = columns.map(col => `\`${col}\` = ?`).join(",");

            const knownValues: string[] = columns.map(col => data.applyAs<string>(col));

            const argumentList = keys.map((k, i) => `${k} = '${values[i]}'`).join(" AND ");

            let sql = `UPDATE ${object.getTable()} SET ${unknownValues} WHERE ${argumentList}`;
            await this.database.execute(sql, knownValues);
            resolve();
        });

    insertObject = (object: T): Promise<void> => new Promise(
        async resolve => {
            const data: SerializedData = new SerializedData();
            object.serialize(data);
            const values: string[] = object.getStructure()
                .map(col => data.applyAs<string>(col));

            let sql = `INSERT INTO ${object.getTable()} (${object.getStructure().join(",")}) VALUES(${"?,".repeat(values.length).slice(0, -1)})`;
            await this.database.execute(sql, values);
            resolve();
        });


    updateTable = (object: T, database: SQLWrapper): Promise<void> => new Promise(
        async resolve => {
            const columns: string[] = await database.getColumns(object.getTable());

            const editor: TableEditor = new TableEditor(object.getTable());

            object.getStructure()
                .filter(s => !columns.includes(s))
                .forEach(s => editor.addColumn(s, "TEXT"));

            columns
                .filter(s => !object.getStructure().includes(s))
                .forEach(s => editor.dropColumn(s));

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

    abstract getByKey(key: string | string[], value: string | string[]): T;
    abstract getDummy(): T;
    abstract onAdd(object: T): void;
    abstract onRemove(object: T): void;
    abstract getValues(): T[];

}