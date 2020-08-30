import { Loadable } from "./util/Loadable";
import { Saveable } from "./util/Saveable";
import { Storage } from "./storage/Storage";

export class StorageHolder implements Loadable, Saveable {

    storages: Set<Storage<any>>;

    constructor() {
        this.storages = new Set();
    }

    save(callback?: ((arg: any) => any) | undefined): Promise<any> {
        throw new Error("Method not implemented.");
    }
    saveSync(callback?: ((arg: any) => any) | undefined) {
        throw new Error("Method not implemented.");
    }
    load(callback?: ((arg: any) => any) | undefined): Promise<any> {
        throw new Error("Method not implemented.");
    }
    loadSync(callback?: ((arg: any) => any) | undefined) {
        throw new Error("Method not implemented.");
    }

}