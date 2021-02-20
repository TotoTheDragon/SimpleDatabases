import { AbstractBody } from "../body/AbstractBody";
import { Cacheable } from "../interfaces/Cacheable";
import { Loadable } from "../interfaces/Loadable";
import { Saveable } from "../interfaces/Saveable";
import { StorageHolder } from "../StorageHolder";

export abstract class AbstractStorage<T extends AbstractBody> implements Cacheable, Loadable, Saveable {

    holder: StorageHolder;
    readonly _holds: any;

    constructor(holder: StorageHolder, holds: any) {
        this.holder = holder;
        this._holds = holds;
        holder.storages.set(this.getDummy().getCollection(), this);

    }

    getDummy(): T {
        return new this._holds(this);
    }

    remove(object: T): Promise<void> {
        return new Promise(async resolve => {
            await object.remove();
            resolve();
        })
    }

    add(object: T): Promise<void> {
        return new Promise(async resolve => {
            await this.onAdd(object);
            await object.save();
            resolve();
        })
    }

    save(): Promise<void> {
        return new Promise(async resolve => {
            await Promise.all(this.getValues().map(object => object.save()));
            resolve();
        })
    }

    abstract load(): Promise<void>;

    abstract cache(identifiers: object, createIfNotExists?: boolean): Promise<any>

    abstract setup(): void | Promise<void>;

    abstract onRemove(object: T): Promise<void>;
    abstract onAdd(object: T): Promise<void>;

    abstract getValues(): T[];
}