import { Loadable } from "../util/Loadable";
import { Saveable } from "../util/Saveable";
import { StorageHolder } from "../StorageHolder";
import { DataBody } from "../body/DataBody";

export abstract class Storage<T extends DataBody> implements Loadable, Saveable, Iterable<T> {

    storageHolder: StorageHolder;

    constructor(holder: StorageHolder) {
        this.storageHolder = holder;
    }

    abstract onAdd(object: T): void;
    abstract onRemove(object: T): void;

    add(object: T) {
        this.onAdd(object);
        this.save(object);
    }

    remove(object: T) {
        this.onRemove(object);
    }

    abstract save(object: T, callback?: (arg: any) => any): any;

    abstract save(callback?: (arg: any) => any): Promise<any>;
    abstract saveSync(callback?: (arg: any) => any): any;
    abstract load(callback?: (arg: any) => any): Promise<any>;
    abstract loadSync(callback?: (arg: any) => any): any;
    abstract [Symbol.iterator](): Iterator<T, any, undefined>;
}