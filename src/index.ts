import { StorageHolder } from "./lib/StorageHolder";

module.exports = {
    StorageHolder: require("./lib/StorageHolder").StorageHolder,
    SerializedData: require("./lib/SerializedData").SerializedData,
    SerializedObject: require("./lib/SerializableObject").SerializedObject,

    Cacheable: require("./lib/util/Cacheable").Cacheable,
    Saveable: require("./lib/util/Saveable").Saveable,
    Loadable: require("./lib/util/Loadable").Loadable,
    DataPair: require("./lib/util/DataPair").DataPair,

    Storage: require("./lib/storage/Storage").Storage,
    SqlStorage: require("./lib/storage/SqlStorage").SqlStorage,

    TableEditor: require("./lib/sql/TableEditor").TableEditor,
    TableCreator: require("./lib/sql/TableCreator").TableCreator,
    SQLWrapper: require("./lib/sql/SQLWrapper").SQLWrapper,
    MySQLDatabase: require("./lib/sql/types/MySQLDatabase").MySQLDatabase,

    DataBody: require("./lib/body/DataBody").DataBody,
    SqlDataBody: require("./lib/body/SqlDataBody").SqlDataBody
};