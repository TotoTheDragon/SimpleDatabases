# SimpleDatabases
This package is a system that will allow you to storage your objects in a database without having to deal with anything regarding the database itsself.
We manage everything with tables and adding/updating/removing data for you.

## How to use
To get started with SimpleDatabases you need to create a StorageHolder, which will keep track of all your storages.
A storage is a collection of all of your objects of ONE specific type.
Then to store the data in the database you will need to create a database object. The currently implemented one is MySQLDatabase.
```typescript
const holder: StorageHolder = new StorageHolder();
const database: MySQLDatabase = new MySQLDatabase({database: "simpledb", user: "simpledb", password: "simpledb"});
```

At this point you need to create an object you want to store. This must extend an AbstractBody. The currently implemented one is MySQLBody.
```typescript

class ExampleObject extends MySQLBody {

    id: string;
    prefix: string;
    level: number;

    constructor(storage: MySQLStorage<MySQLBody>, database: MySQLDatabase) {
        super(storage, database);

        // Store default values here in constructor
        this.prefix = "!";
        this.level = 0;
    }

    getCollection = () => "tablename";
    getIdentifier = () => "id";
    getIdentifierValues = () => this.id;

    getColumns = () => new Map()
        .set("id", ColumnType.VARCHAR50)
        .set("prefix", ColumnType.TINYTEXT)
        .set("level", ColumnType.INT);

    serialize(data: SerializedData) {
        data.write("id", this.id);
        data.write("prefix", this.prefix);
        data.write("level", this.level)
    }

    deserialize(data: SerializedData) {
        this.id = data.get("id");
        this.prefix = data.get("prefix");
        this.level = data.get("level", "number"); // Because we pass "number" as the second parameter, we call parseInt on the data to make sure its a number
    }
}
```

Now we need a holder which will hold our ExampleObject's. This needs to extend AbstractStorage. The currently implemented one is MySQLStorage. This is mainly used to implement your own way of caching data (if you want to cache data, otherwise just have empty functions.)
```typescript
class DataHolder extends MySQLStorage<DataObject> {

    cached: Map<string, DataObject>;

    constructor(holder: StorageHolder, database: MySQLDatabase) {
        super(holder, database, DataObject);
        this.cached = new Map();
    }

    onRemove(object: DataObject): Promise<void> {
        this.cached.delete(object.getIdentifierValues()); // Remove from cache
        return;
    }

    onAdd(object: DataObject): Promise<void> {
        this.cached.set(object.getIdentifierValues(), object); // Add to cache
        return;
    }

    getValues(): DataObject[] {
        return Array.from(this.cached.values());
    }
}
```

Now that we have our dataholder we need to create one. By creating an instance of the class we automatically register it in our storage holder.
```typescript
const holder: StorageHolder = new StorageHolder();
const database: MySQLDatabase = new MySQLDatabase({database: "simpledb", user: "simpledb", password: "simpledb"});

const dataHolder: DataHolder = new DataHolder(holder,database);
```

Now everything is set up for us to start creating and storing objects.

```typescript

const holder: StorageHolder = new StorageHolder();
const database: MySQLDatabase = new MySQLDatabase({database: "simpledb", user: "simpledb", password: "simpledb"});

const dataHolder: DataHolder = new DataHolder(holder,database);

const dataHolderReference: DataHolder = holder.get("tablename"); // This is another way of getting a reference to the data holder

const obj = dataHolder.getOrCreate({id: 1});
obj.prefix = ".";
obj.level = 5;
await obj.save(); // Save this object

const obj2 = dataHolder.getOrCreate({id: 2});
obj2.prefix = "/";

const obj3 = dataHolder.getOrCreate({id: 3});
obj3.level = 6;

await dataHolder.save(); // Save all objects in cache
```