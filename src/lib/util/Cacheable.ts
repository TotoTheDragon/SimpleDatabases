export interface Cacheable {

    cache(key: string | string[], value: string | string[], createIfNotExists: boolean, callback?: (...args: any) => any): Promise<any>;

    cacheAll(key: string | string[], value: string | string[], callback?: (...args: any) => any): Promise<any[]>;

}