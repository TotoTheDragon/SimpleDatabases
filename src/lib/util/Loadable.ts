export interface Loadable {

    load(callback?: (...args: any) => any): Promise<void | void[]>;

}