export interface Saveable {

    save(callback?: (arg: any) => any): Promise<any>;

    saveSync(callback?: (arg: any) => any): any;

}