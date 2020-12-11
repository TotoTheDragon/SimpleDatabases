import { DataBody } from "../body/DataBody";
import { StorageHolder } from "../StorageHolder";
import { Cacheable } from "../util/Cacheable";
import { Loadable } from "../util/Loadable";
import { Saveable } from "../util/Saveable";

export abstract class Storage<T extends DataBody> implements Cacheable, Loadable, Saveable {

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

    getOrCreate = (key: string | string[], value: string | string[]): Promise<T> => new Promise(
        async resolve => {
            const get = this.getByKey(key, value);
            if (get !== undefined) return resolve(get);
            else return resolve(await this.cache(key, value));
        }
    )


    abstract cache(key: string | string[], value: string | string[], callback?: (arg: T) => any): Promise<T>;
    abstract cacheAll(key: string | string[], value: string | string[], callback?: (arg: any) => any): Promise<T[]>;
    abstract saveObject(object: T, callback?: () => void, prepare?: boolean): Promise<void>;

    abstract save(callback?: () => any): Promise<void>;
    abstract load(callback?: () => any): Promise<void>;

    abstract getByKey(key: string | string[], value: string | string[]): T;
    abstract getDummy(): T;
    abstract onAdd(object: T): void;
    abstract onRemove(object: T): void;
    abstract getValues(): T[];

}