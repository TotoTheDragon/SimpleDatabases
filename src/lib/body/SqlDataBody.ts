import { DataBody } from "./DataBody";

export interface SqlDataBody extends DataBody {
    getTable(): string;

    getKey(): string | string[];

    getValues(): string | string[];

    getStructure(): string[];
}