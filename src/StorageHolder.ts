import { SqlDataBody } from "./body/SqlDataBody";
import { Loadable } from "./util/Loadable";
import { Saveable } from "./util/Saveable";
import { Storage } from "./storage/Storage";
import { DataBody } from "./body/DataBody";

export class StorageHolder implements Loadable, Saveable {

    storages: Set<Storage<any>>;

    constructor() {
        this.storages = new Set();
    }

    registerStorage(storage: Storage<any>) {
        this.storages.add(storage);
    }

    getByType<T extends DataBody>(dummy: T): Storage<T> {
        return Array.from(this.storages).find(stora => typeof stora.getDummy() == typeof dummy);
    }

    save(callback?: () => any): Promise<void[]> {
        return Promise.all(Array.from(this.storages).map(storage => storage.save(callback)));
    }

    load(callback?: () => any): Promise<void[]> {
        return Promise.all(Array.from(this.storages).map(storage => storage.load(callback)));
    }
}