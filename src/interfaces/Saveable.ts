export interface Saveable {
    save(): Promise<void>;
}