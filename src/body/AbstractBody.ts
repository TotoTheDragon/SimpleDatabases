import { SerializableObject } from "../objects/SerializableObject";
import { SerializedData } from "../objects/SerializedData";
import { AbstractStorage } from "../storage/AbstractStorage";

export abstract class AbstractBody implements SerializableObject {

    storage: AbstractStorage<AbstractBody>;

    constructor(storage: AbstractStorage<AbstractBody>) {
        this.storage = storage;
    }

    abstract remove(): Promise<void>;
    abstract save(): Promise<void>;

    abstract getCollection(): string;

    abstract getIdentifier(): string | string[];

    abstract getIdentifierValues(): string | string[];

    abstract getFields(): string[];

    /* SerializeableObject */

    abstract serialize(data: SerializedData): void;
    abstract deserialize(data: SerializedData): void;
}