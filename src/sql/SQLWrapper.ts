import { DataPair } from "../util/DataPair";
import { TableCreator } from "./TableCreator";

export abstract class SQLWrapper {

    newTableCreator(): TableCreator {
        return new TableCreator(this);
    }

    abstract execute(sql: string): Promise<void>;

    abstract isPrimaryKeyUsed(table: string, key: string, structure: string[]): Promise<Boolean>;

    abstract getAllValuesOf(table: string, structure: string[]): Promise<Set<DataPair<string, string>>[]>;

    abstract getColumns(table: string): Promise<string[]>;

    abstract getTables(): Promise<string[]>;

    abstract remove(table: string, key: string, structure: string[]): Promise<void>;
}