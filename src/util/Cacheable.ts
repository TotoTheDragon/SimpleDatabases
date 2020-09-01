export interface Cacheable {

    cache(primaryKey: any, callback?: (...args: any) => any): Promise<any>;

    cacheAll(key: string, value: any, callback?: (...args: any) => any): Promise<any[]>;

}