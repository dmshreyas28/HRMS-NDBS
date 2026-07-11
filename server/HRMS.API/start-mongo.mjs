import { MongoMemoryServer } from "mongodb-memory-server";

console.log("Starting in-memory MongoDB server on port 27017...");

try {
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: "hrms"
    }
  });
  console.log("\n==================================================");
  console.log("  SUCCESS: In-memory MongoDB is running on port 27017!");
  console.log("  Connection URI: " + mongod.getUri());
  console.log("==================================================\n");
  console.log("Keep this terminal window open to keep the database running.");
} catch (err) {
  console.error("\nFailed to start in-memory MongoDB:", err.message);
  console.log("Make sure port 27017 is not already in use by another program.\n");
}

// Keep the process alive
process.stdin.resume();
