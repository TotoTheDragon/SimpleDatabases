import { Connection, createConnection, Query } from "mysql";
import { SQLWrapper } from "../SQLWrapper";
import { DataPair } from "../../util/DataPair";
export class MySQLDatabase extends SQLWrapper {

    connection: Connection;

    constructor() {
        super();
    }

    provideConnection(): Connection {
        return createConnection(
            {
                host: "localhost",
                port: 3306,
                user: "simpledb",
                password: "simpledb",
                database: "simpledb"
            }
        );
    }

    getConnection(): Connection {
        if (!this.connection) {
            try {
                this.connection = this.provideConnection();
            } catch (err) { }
        }
        return this.connection;
    }

    getColumns(table: string): Promise<string[]> {
        return new Promise(resolve => {
            const query: Query = this.getConnection().query(`SELECT * FROM ${table}`);
            query.on("result", row => resolve(Object.keys(row)));
            query.on("end", () => resolve(undefined));
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
            const query: Query = this.getConnection().query(`SELECT * FROM information_schema.tables WHERE table_schema=\"${this.getConnection().config.database}\"`);
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

    getAllValuesOf(table: string, structure: string[]): Promise<Set<DataPair<string, string>>[]> {
        const data: Set<DataPair<string, string>>[] = [];
        return new Promise(resolve => {
            const query: Query = this.getConnection().query(`SELECT * FROM ${table}`);

            query.on("result", row => {
                const set: Set<DataPair<string, string>> = new Set();
                for (const column of structure) {
                    set.add(new DataPair(column, row[column]));
                }
                data.push(set);
            })

            query.on("end", () => resolve(data));
        })
    }

    remove(table: string, key: string, structure: string[]): Promise<void> {
        return new Promise(resolve => {
            const query: Query = this.getConnection().query(`DELETE FROM ${table} WHERE ${structure[0]} = '${key}'`);
            query.on("end", () => resolve());
        });
    }


}