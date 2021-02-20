export interface Cacheable {
    cache(identifiers: object, createIfNotExists?: boolean): Promise<any>;
}