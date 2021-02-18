import { DataPair } from "../util/DataPair";
import { TableCreator } from "./TableCreator";
import { SerializedData } from "../SerializedData";

export abstract class SQLWrapper {

    newTableCreator(): TableCreator {
        return new TableCreator(this);
    }

    abstract execute(sql: string, values?: any[]): Promise<any>;

    abstract isKeyUsed(table: string, key: string | string[], value: string | string[]): Promise<Boolean>;

    abstract getFirstResult(key: string | string[], value: string | string[], table: string): Promise<SerializedData>;

    abstract getAllResults(key: string | string[], value: string | string[], table: string): Promise<SerializedData[]>;

    abstract getAllValuesOf(table: string, structure: string[]): Promise<SerializedData[]>;

    abstract getColumns(table: string): Promise<string[]>;

    abstract getTables(): Promise<string[]>;

    abstract remove(table: string, key: string | string[], value: string | string[]): Promise<void>;
}