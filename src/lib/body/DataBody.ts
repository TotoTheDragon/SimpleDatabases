import { SerializableObject } from "../SerializableObject";
import { Saveable } from "../util/Saveable";

export interface DataBody extends SerializableObject {
    remove(): void;
}