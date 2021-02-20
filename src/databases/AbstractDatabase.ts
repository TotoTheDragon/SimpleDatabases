import { SerializableObject } from "../objects/SerializableObject";
import { SerializedData } from "../objects/SerializedData";

export abstract class AbstractDatabase {

    abstract connect(): Promise<void>;

    abstract removeObject(obj: SerializableObject): Promise<void>;

    abstract saveObject(obj: SerializableObject): Promise<void>;

    abstract updateObject(obj: SerializableObject): Promise<void>;

    abstract insertObject(obj: SerializableObject): Promise<void>;

    abstract getAllValues(document: string): Promise<SerializedData[]>; // Document is: Table in SQL, Collection in MongoDB etc.
}