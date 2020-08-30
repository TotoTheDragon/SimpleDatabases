export interface Loadable {

    load(callback?: (arg: any) => any): Promise<any>;

    loadSync(callback?: (arg: any) => any): any;

}