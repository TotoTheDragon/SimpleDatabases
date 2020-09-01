import { DataBody } from "./DataBody";

export interface SqlDataBody extends DataBody {
    getTable(): string;

    getKey(): string;

    getStructure(): string[];
}