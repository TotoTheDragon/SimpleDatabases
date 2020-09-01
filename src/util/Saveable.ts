export interface Saveable {

    save(callback?: (...args: any) => any): Promise<void | void[]>;

}