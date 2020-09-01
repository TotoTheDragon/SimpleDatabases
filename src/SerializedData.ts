export class SerializedData {

    json: object;

    constructor(jsonElement?: object) {
        this.json = jsonElement || {}
    }

    applyAs<T>(field?: string): T {
        return field ? this.json[field] : this.json;
    }

    getAsObject(field?: string): object {
        return field ? this.json[field] : this.json;
    }

    write(field: string, object: Object) {
        this.json[field] = object;
    }

}