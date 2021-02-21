import { readdir, stat } from "fs/promises";
import { join } from "path";
import { ColumnType } from "./Constants";

export class SDUtil {

    static safeJSONParse(input: string) {
        try {
            return JSON.parse(JSON.stringify(input));
            typeof Number
        } catch (err) {
            return undefined;
        }
    }

    static makeArray(input: any | any[]): any[] {
        return Array.isArray(input) ? input : Array.of(input);
    }

    static isSameMap(map1: Map<any, any>, map2: Map<any, any>): boolean {
        if (map1.size !== map2.size) return false;
        let same = true;
        map1.forEach((v, k) => same = same && (map2.has(k) && map2.get(k) === v));
        return same;
    }

    static getColumnType(input: string): string {
        if (!input) return undefined;
        input = input.toString().toUpperCase();
        if (!ColumnType[input] && input.includes("VARCHAR")) {
            const amount: number = parseInt(input.match(/\d(\d)*/g)[0]);
            switch (amount) {
                case 10:
                    return ColumnType[ColumnType.VARCHAR10];
                case 20:
                    return ColumnType[ColumnType.VARCHAR20];
                case 30:
                    return ColumnType[ColumnType.VARCHAR30];
                case 40:
                    return ColumnType[ColumnType.VARCHAR40];
                case 50:
                    return ColumnType[ColumnType.VARCHAR50];
                case 100:
                    return ColumnType[ColumnType.VARCHAR100];
                default: break;
            }
        }
        if (!ColumnType[input] && input === "INTEGER") return ColumnType[ColumnType.INT];
        return ColumnType[ColumnType[input]];
    }

    static fromColumnType(input: ColumnType): string {
        const type: string = (typeof input === "number" ? ColumnType[input] : input).toString();
        if (type.includes("VARCHAR"))
            switch (ColumnType[type]) {
                case ColumnType.VARCHAR10:
                    return "VARCHAR(10)";
                case ColumnType.VARCHAR20:
                    return "VARCHAR(20)";
                case ColumnType.VARCHAR30:
                    return "VARCHAR(30)";
                case ColumnType.VARCHAR40:
                    return "VARCHAR(40)";
                case ColumnType.VARCHAR50:
                    return "VARCHAR(50)";
                case ColumnType.VARCHAR100:
                    return "VARCHAR(100)";
            }

        return type;
    }

    static getExecutionPath(): string {
        return process.argv[1].split("\\").slice(0, -1).join("\\");
    }

    static async findFiles(dir: string, recursive: boolean = false): Promise<string[]> {
        try {
            if (recursive) return (await SDUtil.findFilesRecursive(dir)).map(f => f.substr(join(dir).length))
            return await (readdir(dir));
        } catch (err) {
            return [];
        }
    }

    static async findFilesRecursive(dir: string, allFiles: string[] = []): Promise<string[]> {
        const files = (await readdir(dir)).map(f => join(dir, f))
        allFiles.push(...files)
        await Promise.all(files.map(async f => (await stat(f)).isDirectory() && SDUtil.findFilesRecursive(f, allFiles)));
        return allFiles;
    }

}