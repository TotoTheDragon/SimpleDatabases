import { DataBody } from "../body/DataBody";
import { StorageHolder } from "../StorageHolder";
import { Cacheable } from "../util/Cacheable";
import { Loadable } from "../util/Loadable";
import { Saveable } from "../util/Saveable";

export abstract class Storage<T extends DataBody> implements Cacheable, Loadable, Saveable, Iterable<T> {

    storageHolder: StorageHolder;

    constructor(holder: StorageHolder) {
        this.storageHolder = holder;
    }

    add(object: T): Promise<void> {
        return new Promise(async resolve => {
            this.onAdd(object);
            await this.saveObject(object);
            resolve();
        });
    }

    remove(object: T): Promise<void> {
        return new Promise(async resolve => {
            this.onRemove(object);
            resolve();
        });
    }


    abstract cache(primaryKey: any, callback?: (arg: T) => any): Promise<T>;
    abstract cacheAll(key: string, value: any, callback?: (arg: any) => any): Promise<T[]>;
    abstract saveObject(object: T, callback?: () => void, prepare?: boolean): Promise<void>;

    abstract save(callback?: () => any): Promise<void>;
    abstract load(callback?: () => any): Promise<void>;

    abstract getDummy(): T;
    abstract onAdd(object: T): void;
    abstract onRemove(object: T): void;
    abstract [Symbol.iterator](): Iterator<T, any, undefined>;

}