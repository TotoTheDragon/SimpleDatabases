import { SerializableObject } from "../SerializableObject";

export interface DataBody extends SerializableObject {
    remove(): void;
    save(): void;
}