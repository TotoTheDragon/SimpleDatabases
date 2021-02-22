import { SerializableObject } from "./SerializableObject";
import { SDUtil } from "../util/Util";

export class SerializedData {

    json: any;

    constructor(object?: SerializableObject) {
        this.json = {};
        if (object) object.serialize(this);
    }

    write(key: string, value: any): SerializedData {
        const type = typeof value;
        if (value === undefined) this.json[key] = undefined;
        else if (type !== "object" && type !== "function" || value === null) this.json[key] = value;
        else if (value.toJSON !== undefined) this.json[key] = value.toJSON();
        else if (value.serialize !== undefined) this.json[key] = new SerializedData(value).toJSON();
        else if (value.values !== undefined) this.json[key] = [...value.values()];
        else if (type === "function") this.json[key] = value();
        else if (type === "object") this.json[key] = value;
        return this;
    }

    applyAs<T>(key: string, type?: string): T {
        return this.get(key, type);
    }

    get(key: string, type: string | any = "string"): any {
        if (this.json[key] === undefined) return undefined;

        if (typeof type === "string") {
            if (type === "string") return this.json[key]?.toString() ?? this.json[key];
            if (type === "number") return parseInt(this.json[key]);
            if (type === "json") return SDUtil.safeJSONParse(this.json[key]);
        } else {
            try {
                const val = new type();
                val.deserialize(SerializedData.fromJSON(SDUtil.safeJSONParse(this.json[key])));
                return val;
            } catch {
                return undefined
            }
        }
        return this.json[key];
    }

    has(key: string, checkUndefined: boolean = true): boolean {
        return Object.keys(this.json).includes(key) && (!checkUndefined || this.json[key] !== undefined);
    }

    toJSON(): any {
        return this.json;
    }

    static fromJSON(json: any): SerializedData {
        const data = new SerializedData();
        Object.keys(json).forEach(v => data.write(v, json[v]));
        return data;
    }
}