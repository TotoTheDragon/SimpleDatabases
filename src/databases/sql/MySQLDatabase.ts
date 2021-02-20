import { ConnectionConfig, createPool, format, Pool } from "mysql";
import { MySQLBody } from "../../body/sql/MySQLBody";
import { SerializedData } from "../../objects/SerializedData";
import { ColumnType, DataPair } from "../../util/Constants";
import { SDUtil } from "../../util/Util";
import { AbstractDatabase } from "../AbstractDatabase";

export class MySQLDatabase extends AbstractDatabase {

    options: ConnectionConfig;

    pool: Pool;

    tables: string[];

    constructor(options: ConnectionConfig) {
        super();
        this.options = options;
    }

    async connect(): Promise<void> {
        return new Promise(resolve => {
            this.pool = createPool({ ...this.options });
            this.pool.getConnection(() => { });
            this.pool.on("error", err => console.log(err))
            this.pool.on("connection", () => resolve());
        });
    }

    async query(sql: string, values?: any | any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            let results = [];
            const query = this.pool.query({ sql: sql, values: values });
            console.log(format(query.sql, values))
            query.on("result", row => results.push(row));
            query.on("end", () => resolve(results));
            query.on("error", (err) => reject(format(query.sql, values) + "\n\n" + err));
        })
    }

    removeObject(obj: MySQLBody): Promise<void> {
        const identifiers = SDUtil.makeArray(obj.getIdentifier());
        const values = SDUtil.makeArray(obj.getIdentifierValues());
        return this.query(`DELETE FROM \`${obj.getCollection()}\` WHERE ${identifiers.map(i => `${i}=?`).join(" AND")};`, [...values]);
    }

    async saveObject(obj: MySQLBody): Promise<void> {
        return obj.cache ? this.updateObject(obj) : this.insertObject(obj);
    }

    updateObject(obj: MySQLBody): Promise<void> {
        const identifiers = SDUtil.makeArray(obj.getIdentifier());
        const values = SDUtil.makeArray(obj.getIdentifierValues());
        const serialized = new SerializedData(obj);
        const changed: string[] = obj.cache ? obj.getFields().filter(f => obj.cache.get(f, "json") != serialized.get(f, "json")) : obj.getFields();
        if (changed.length <= 0) return;
        return this.query(`UPDATE \`${obj.getCollection()}\` SET ${changed.map(f => "`" + f + "`=?").join(", ")} WHERE ${identifiers.map(i => `${i}=?`).join(" AND")};`, [...changed.map(f => serialized.get(f, "json")), ...values]);
    }

    insertObject(obj: MySQLBody): Promise<void> {
        const data = new SerializedData(obj);
        return this.query(`INSERT INTO \`${obj.getCollection()}\` (${obj.getFields().map(f => "`" + f + "`").join(", ")}) VALUES (${obj.getFields().map(() => "?").join(", ")})`, obj.getFields().map(f => data.get(f, "json")));
    }

    async selectObject(table: string, identifiers: string | string[], values: string | string[]): Promise<SerializedData> {
        identifiers = SDUtil.makeArray(identifiers);
        values = SDUtil.makeArray(values);
        const result: any = SDUtil.makeArray(await this.query(`SELECT * FROM  \`${table}\` WHERE ${identifiers.map(i => `${i}=?`).join(" AND")} LIMIT 1;`, values))[0];
        return result ? SerializedData.fromJSON(result) : undefined;
    }

    async getAllValues(table: string): Promise<SerializedData[]> {
        const results: any[] = SDUtil.makeArray(await this.query(`SELECT * FROM  \`${table}\`;`));
        return results.map(r => SerializedData.fromJSON(r));
    }

    async isInDatabase(obj: MySQLBody): Promise<boolean> {
        const identifiers = SDUtil.makeArray(obj.getIdentifier());
        const values = SDUtil.makeArray(obj.getIdentifierValues());
        return (await this.query(`SELECT EXISTS(SELECT 1 FROM \`${obj.getCollection()}\` WHERE ${identifiers.map(i => `${i}=?`).join(" AND")} LIMIT 1) AS exist;`, [...values]))[0].exist;
    }

    async getColumns(table: string): Promise<Map<string, ColumnType>> {
        const map = new Map();
        const query: any[] = await this.query(`SELECT COLUMN_NAME,COLUMN_TYPE FROM information_schema.columns WHERE table_name='${table}' AND table_schema='${this.options.database}';`);
        SDUtil.makeArray(query).forEach(row => map.set(row.COLUMN_NAME, SDUtil.getColumnType(row.COLUMN_TYPE)))
        return map;
    }

    async fetchTables(): Promise<void> {
        if (this.tables && this.tables.length) return; // Tabbles object already exists
        this.tables = [];
        const query: any[] = await this.query(`SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema='${this.options.database}';`);
        this.tables = SDUtil.makeArray(query).map(row => row.TABLE_NAME);
    }
}

export class MySQLTableEditor {

    table: string;

    dropColumns: string[];
    addColumns: DataPair<string, ColumnType>[];
    modifiedColumns: DataPair<string, ColumnType>[];

    constructor(table: string) {
        this.table = table;
        this.dropColumns = [];
        this.addColumns = [];
        this.modifiedColumns = [];
    }

    async edit(database: MySQLDatabase, current: Map<string, ColumnType>, supposed: Map<string, ColumnType>): Promise<void> {

        await database.fetchTables();

        if (!database.tables.includes(this.table)) throw Error("Trying to edit table that does not exist yet!");

        supposed.forEach((v, k) => {
            if (!current.has(k)) return this.addColumns.push(new DataPair(k, v));
            if (current.get(k) !== v) return this.modifiedColumns.push(new DataPair(k, v));
        });

        current.forEach((v, k) => {
            if (!supposed.has(k)) return this.dropColumns.push(k);
        });

        for (const column of this.addColumns)
            await database.query(`ALTER TABLE \`${this.table}\` ADD ${column.key} ${SDUtil.fromColumnType(column.value)};`);

        for (const column of this.modifiedColumns)
            await database.query(`ALTER TABLE \`${this.table}\` MODIFY ${column.key} ${SDUtil.fromColumnType(column.value)};`);

        for (const column of this.dropColumns)
            await database.query(`ALTER TABLE \`${this.table}\` DROP COLUMN ${column};`);

        return;
    }
}

export class MySQLTableCreator {

    table: string

    constructor(table: string) {
        this.table = table;
    }

    async create(database: MySQLDatabase, columns: Map<string, ColumnType>): Promise<void> {

        await database.fetchTables();

        if (database.tables.includes(this.table)) throw Error("Trying to create table that already exists!");

        const keys = Array.from(columns.keys());

        return database.query(`CREATE TABLE ${this.table} (${keys.map(key => `${key} ${SDUtil.fromColumnType(columns.get(key))}`).join(", ")})`);
    }

}