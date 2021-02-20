export enum ColumnType {
    INT,
    TINYINT,
    SMALLINT,
    MEDIUMINT,
    BIGINT,

    DECIMAL,
    FLOAT,
    DOUBLE,
    BIT,

    CHAR,
    VARCHAR10,
    VARCHAR20,
    VARCHAR30,
    VARCHAR40,
    VARCHAR50,
    VARCHAR100,
    TINYTEXT,
    TEXT,
    MEDIUMTEXT,
    LONGTEXT,

    OTHER
}

export class DataPair<K, V> {

    key: K;
    value: V;

    constructor(key: K, value: V) {
        this.key = key;
        this.value = value;
    }

}