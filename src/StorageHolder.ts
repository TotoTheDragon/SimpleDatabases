import { Loadable } from "./util/Loadable";
import { Saveable } from "./util/Saveable";
import { Storage } from "./storage/Storage";

export class StorageHolder implements Loadable, Saveable {

    storages: Set<Storage<any>>;

    constructor() {
        this.storages = new Set();
    }

    registerStorage(storage: Storage<any>) {
        this.storages.add(storage);
    }

    save(callback?: () => any): Promise<void[]> {
        return Promise.all(Array.from(this.storages).map(storage => storage.save(callback)));
    }

    load(callback?: () => any): Promise<void[]> {
        return Promise.all(Array.from(this.storages).map(storage => storage.load(callback)));
    }
}