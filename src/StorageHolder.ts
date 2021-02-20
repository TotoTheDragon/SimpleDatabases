import { AbstractBody } from "./body/AbstractBody";
import { Loadable } from "./interfaces/Loadable";
import { Saveable } from "./interfaces/Saveable";
import { AbstractStorage } from "./storage/AbstractStorage";

export class StorageHolder implements Loadable, Saveable {

    storages: Map<string, AbstractStorage<any>>;



    constructor() {
        this.storages = new Map();
    }

    get(collection: string) {
        return this.storages.get(collection);
    }

    getByType<T extends AbstractBody>(dummy: T): AbstractStorage<T> {
        return this.getStorages().find(storage => storage.getDummy() instanceof dummy.constructor);
    }

    async setupAll(): Promise<void> {
        for (const s of this.storages.values()) await s.setup();
        return;
    }

    async save(): Promise<void> {
        await Promise.all(this.getStorages().map(s => s.save()));
        return;
    }

    async load(): Promise<void> {
        await Promise.all(this.getStorages().map(s => s.load()));
        return;
    }

    getStorages(): AbstractStorage<any>[] {
        return Array.from(this.storages.values());
    }
}