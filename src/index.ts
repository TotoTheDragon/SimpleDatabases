import { MySQLDatabase } from "./sql/types/MySQLDatabase";

test();

async function test() {
    console.log("STARTED");
    const db = new MySQLDatabase();
    console.log("FINISHED");
}