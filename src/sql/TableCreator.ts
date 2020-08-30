import { SQLWrapper } from "./SQLWrapper";
import { DataPair } from "../util/DataPair";

export class TableCreator {

    database: SQLWrapper;
    columns: DataPair<string, string>[];
    name: string;

    constructor(database: SQLWrapper) {
        this.database = database;
        this.columns = [];
    }

    setName(name: string): TableCreator {
        this.name = name;
        return this;
    }

}