import { DataPair } from "../util/DataPair";
import { SQLWrapper } from "./SQLWrapper";

export class TableEditor {

    table: string;
    dropColumns: string[];
    addColumns: DataPair<string, string>[];
    renamedColumns: DataPair<string, string>[];

    constructor(table: string) {
        this.table = table;
        this.dropColumns = [];
        this.addColumns = [];
        this.renamedColumns = [];
    }

    addColumn(name: string, type: string): TableEditor {
        this.addColumns.push(new DataPair(name, type));
        return this;
    }

    renameColumn(oldName: string, newName: string): TableEditor {
        this.renamedColumns.push(new DataPair(oldName, newName));
        return this;
    }

    dropColumn(name: string): TableEditor {
        this.dropColumns.push(name);
        return this;
    }

    edit(database: SQLWrapper): Promise<void> {
        return new Promise(async resolve => {
            if (!(await database.getTables()).includes(this.table)) resolve();

            const columns = await database.getColumns(this.table)

            for (const column of this.addColumns)
                if (!columns.includes(column.key))
                    await database.execute(`ALTER TABLE ${this.table} ADD ${column.key} ${column.value}`);

            for (const column of this.renamedColumns)
                await database.execute(`ALTER TABLE ${this.table} RENAME COLUMN ${column.key} to ${column.value}`);

            for (const column of this.dropColumns)
                await database.execute(`ALTER TABLE ${this.table} DROP COLUMN ${column}`);

            resolve();
        })

    }

}