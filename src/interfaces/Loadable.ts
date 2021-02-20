export interface Loadable {
    load(): Promise<void>;
}