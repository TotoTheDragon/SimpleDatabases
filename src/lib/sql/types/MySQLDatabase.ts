import { Connection, ConnectionConfig, createConnection, Query } from "mysql";
import { SerializedData } from "../../SerializedData";
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
            const query: Query = this.getConnection().query(`SELECT * FROM information_schema.columns WHERE table_name='${table}'`);
            query.on("result", row => columns.push(row.COLUMN_NAME));
            query.on("end", () => resolve(columns));
        })
    }

    execute(sql: string): Promise<void> {
        return new Promise(resolve => {
            const query: Query = this.getConnection().query(sql);
            query.on("end", () => resolve());
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

    isPrimaryKeyUsed(table: string, key: string, structure: string[]): Promise<Boolean> {
        return new Promise(resolve => {
            const query: Query = this.getConnection().query(`SELECT ${structure[0]} FROM ${table} WHERE ${structure[0]} = '${key}'`);
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

    remove(table: string, key: string, structure: string[]): Promise<void> {
        return new Promise(resolve => {
            const query: Query = this.getConnection().query(`DELETE FROM ${table} WHERE ${structure[0]} = '${key}'`);
            query.on("end", () => resolve());
        });
    }

    getFirstResult(key: string, value: string, table: string): Promise<SerializedData> {
        return new Promise(resolve => {
            const query: Query = this.getConnection().query(`SELECT * FROM ${table} WHERE ${key} = '${value}'`);
            query.on("result", row => {
                for (const k of Object.keys(row)) {
                    if (row[k] !== undefined && row[k] !== null)
                        row[k] = row[k].replace(new RegExp(`\n`, "g"), "\\n");
                }
                return resolve(new SerializedData(row));
            })
            query.on("end", () => resolve(undefined));
        })
    }

    getAllResults(key: string, value: string, table: string): Promise<SerializedData[]> {
        const output: SerializedData[] = [];
        return new Promise(resolve => {
            const query: Query = this.getConnection().query(`SELECT * FROM ${table} WHERE ${key} = '${value}'`);
            query.on("result", row => output.push(new SerializedData(row)));
            query.on("end", () => resolve(output));
        })
    }


}