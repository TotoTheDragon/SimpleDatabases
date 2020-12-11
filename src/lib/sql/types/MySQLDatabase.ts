import { Connection, ConnectionConfig, createConnection, Query } from "mysql";
import { SerializedData } from "../../SerializedData";
import { toArray } from "../../StringUtil";
import { SQLWrapper } from "../SQLWrapper";
export class MySQLDatabase extends SQLWrapper {

    connection: Connection;

    constructor(private config: ConnectionConfig) {
        super();
    }

    provideConnection = () => createConnection(this.config);

    getConnection(): Connection {
        if (!this.connection) {
            try {
                this.connection = this.provideConnection();
            } catch (err) { }
        }
        return this.connection;
    }

    getColumns(table: string): Promise<string[]> {
        const columns = [];
        return new Promise(resolve => {
            const query: Query = this.getConnection().query(`SELECT * FROM information_schema.columns WHERE table_name='${table}' AND table_schema='${this.getConnection().config.database}'`);
            query.on("result", row => columns.push(row.COLUMN_NAME));
            query.on("end", () => resolve(columns));
        })
    }

    execute(sql: string, values?: string[]): Promise<any> {
        return new Promise(resolve => {
            const results = [];
            const query: Query = this.getConnection().query(sql, values);
            query.on("result", row => results.push(row));
            query.on("end", () => resolve(results));
        })
    }

    getTables(): Promise<string[]> {
        const tables = [];
        return new Promise(resolve => {
            const query: Query = this.getConnection().query(`SELECT * FROM information_schema.tables WHERE table_schema='${this.getConnection().config.database}'`);
            query.on("result", row => tables.push(row.TABLE_NAME));
            query.on("end", () => resolve(tables));
        });
    }

    isKeyUsed(table: string, key: string | string[], value: string | string[]): Promise<Boolean> {
        return new Promise(resolve => {
            const values = toArray(value);
            const argumentList = toArray(key).map((k, i) => `${k} = '${values[i]}'`).join(" AND ");
            const query: Query = this.getConnection().query(`SELECT ${toArray(key)[0]} FROM ${table} WHERE ${argumentList}`);
            query.on("result", () => resolve(true));
            query.on("end", () => resolve(false));
        });
    }

    getAllValuesOf(table: string, structure: string[]): Promise<SerializedData[]> {
        const output: SerializedData[] = [];
        return new Promise(resolve => {
            const query: Query = this.getConnection().query(`SELECT * FROM ${table}`);
            query.on("result", row => output.push(new SerializedData(row as object)));
            query.on("end", () => resolve(output));
        })
    }

    remove(table: string, key: string | string[], value: string | string[]): Promise<void> {
        return new Promise(resolve => {
            const values = toArray(value);
            const argumentList = toArray(key).map((k, i) => `${k} = '${values[i]}'`).join(" AND ");
            const query: Query = this.getConnection().query(`DELETE FROM ${table} WHERE ${argumentList}`);
            query.on("end", () => resolve());
        });
    }

    getFirstResult(key: string | string[], value: string | string[], table: string): Promise<SerializedData> {
        return new Promise(resolve => {
            const values = toArray(value);
            const argumentList = toArray(key).map((k, i) => `${k} = '${values[i]}'`).join(" AND ");
            const query: Query = this.getConnection().query(`SELECT * FROM ${table} WHERE ${argumentList}`);
            query.on("result", row => {
                for (const k of Object.keys(row)) {
                    if (row[k] !== undefined && row[k] !== null)
                        row[k] = row[k].toString().replace(new RegExp(`\n`, "g"), "\\n");
                }
                return resolve(new SerializedData(row));
            })
            query.on("end", () => resolve(undefined));
        })
    }

    getAllResults(key: string | string[], value: string | string[], table: string): Promise<SerializedData[]> {
        const values = toArray(value);
        const argumentList = toArray(key).map((k, i) => `${k} = '${values[i]}'`).join(" AND ");
        const output: SerializedData[] = [];
        return new Promise(resolve => {
            const query: Query = this.getConnection().query(`SELECT * FROM ${table} WHERE ${argumentList}`);
            query.on("result", row => output.push(new SerializedData(row)));
            query.on("end", () => resolve(output));
        })
    }


}