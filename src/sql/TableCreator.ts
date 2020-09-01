import { SQLWrapper } from "./SQLWrapper";
import { DataPair } from "../util/DataPair";

export class TableCreator {

    database: SQLWrapper;
    columns: DataPair<string, string>[];
    primary: DataPair<string, string>;
    name: string;

    constructor(database: SQLWrapper) {
        this.database = database;
        this.columns = [];
    }

    setName(name: string): TableCreator {
        this.name = name;
        return this;
    }

    addColumn(column: string, type: string): TableCreator {
        this.columns.push(new DataPair(column, type));
        return this;
    }

    primaryKey(column: string, type: string): TableCreator {
        this.primary = new DataPair(column, type);
        return this;
    }

    create(): Promise<SQLWrapper> {
        return new Promise(resolve => {
            let sql = `CREATE TABLE IF NOT EXISTS ${this.name} (`;

            if (this.primary) sql += `${this.primary.key} VARCHAR(255), `;
            sql += this.columns.map(col => `${col.key} ${col.value}`).join(", ");
            sql += `, PRIMARY KEY (${this.primary.key}))`;
            this.database.execute(sql);
            resolve(this.database);
        });
    }

}