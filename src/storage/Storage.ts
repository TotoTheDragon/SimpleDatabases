import { DragonController } from "..";
import { SqlDataBody } from "../body/SqlDataBody";
import { SerializedData } from "../SerializedData";
import { SQLWrapper } from "../sql/SQLWrapper";
import { StorageHolder } from "../StorageHolder";
import { Cacheable } from "../util/Cacheable";
import { Loadable } from "../util/Loadable";
import { Saveable } from "../util/Saveable";
import { TableCreator } from "../sql/TableCreator";
import { TableEditor } from "../sql/TableEditor";
import { Guild } from "../test/Guild";

export abstract class Storage<T extends SqlDataBody> implements Cacheable, Loadable, Saveable, Iterable<T> {

    storageHolder: StorageHolder;
    database: SQLWrapper;

    constructor(holder: StorageHolder, db: SQLWrapper) {
        this.storageHolder = holder;
        this.database = db;
    }

    add(object: T) {
        this.onAdd(object);
        this.saveObject(object);
    }

    remove(object: T) {
        this.onRemove(object);
        this.database.remove(object.getTable(), object.getKey(), object.getStructure());
    }


    cache = (primaryKey: any, callback?: (arg: T) => any): Promise<T> => {
        return new Promise(resolve => {

        });
    }
    cacheAll = (key: string, value: any, callback?: (arg: any) => any): Promise<T[]> => {
        return new Promise(resolve => {

        });
    }

    saveObject = (object: T, prepare: boolean = true, callback?: () => any): Promise<void> => {
        return new Promise(async resolve => {
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
    }

    save = (callback?: () => any): Promise<void> => {
        return new Promise(async resolve => {
            let first = true;
            let promises = [];
            for (const databody of this) {
                if (first) {
                    first = false;
                    await this.prepareTable(databody);
                }
                promises.push(this.saveObject(databody, false, callback));
            }
            await Promise.all(promises);
            resolve();
        });
    };
    load = (callback?: () => any): Promise<void> => {
        return new Promise(async resolve => {
            const dummy: T = this.getDummy();
            const values: SerializedData[] = await this.database.getAllValuesOf(dummy.getTable(), dummy.getStructure());

            for (const data of values) {
                const t: T = this.getDummy();
                t.deserialize(data);
                console.log("CALLING ON ADD IN LOAD");
                this.onAdd(t);
            }
            if (callback) callback();
            resolve();
        })
    }

    prepareTable = (object: T): Promise<void> => {
        return new Promise(async resolve => {
            const tables = await this.database.getTables();
            if (tables.includes(object.getTable())) resolve(this.updateTable(object, this.database));
            resolve(this.insertTable(object, this.database));
        });
    }

    updateObject(object: T, primaryKey: string): Promise<void> {
        return new Promise(resolve => {
            const data: SerializedData = new SerializedData();
            object.deserialize(data);
            let values = object.getStructure().slice(1).filter(col => data.applyAs(col) != undefined).map(col => `${col} = '${data.applyAs<string>(col)}'`).join(",");
            let sql = `UPDATE ${object.getTable()} SET ${values} WHERE ${object.getStructure()[0]} = '${primaryKey}'`;
            console.log(sql);
            resolve(this.database.execute(sql));
        });
    }

    insertObject(object: T, primaryKey: string): Promise<void> {
        return new Promise(resolve => {
            const data: SerializedData = new SerializedData();
            object.deserialize(data);
            let values = object.getStructure().map(col => data.applyAs<string>(col)).join(",");
            let sql = `INSERT INTO ${object.getTable()} (${object.getStructure().join(",")}) VALUES(${values})`;
            console.log(sql);
            resolve(
                this.database.execute(sql)
            );
        });
    }

    updateTable(object: T, database: SQLWrapper): Promise<void> {
        return new Promise(async resolve => {

            const columns: string[] = await database.getColumns(object.getTable());
            const editor: TableEditor = new TableEditor();

            object.getStructure()
                .filter(s => !columns.includes(s))
                .forEach(s => editor.addColumn(s, "TEXT"));

            resolve(editor.edit(database));
        });
    }

    insertTable(object: T, database: SQLWrapper): Promise<void> {
        return new Promise(async resolve => {

            const creator: TableCreator = database
                .newTableCreator()
                .setName(object.getTable())
                .primaryKey(object.getStructure()[0], "VARCHAR(255)");

            for (const col of object.getStructure().slice(1))
                creator.addColumn(col, "TEXT");

            await creator.create();
            resolve();
        });
    }

    abstract getDummy(): T;
    abstract onAdd(object: T): void;
    abstract onRemove(object: T): void;
    abstract [Symbol.iterator](): Iterator<T, any, undefined>;

}