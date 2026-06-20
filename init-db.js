const dbName = 'hrms';
const conn = new Mongo();
const db = conn.getDB(dbName);

print(`Initializing database: ${dbName}...`);

// Create collections
const collections = ['users', 'positions', 'candidates', 'notifications', 'mrfTemplates', 'costCentres', 'doaList'];
collections.forEach(col => {
    if (!db.getCollectionNames().includes(col)) {
        db.createCollection(col);
        print(`Created collection: ${col}`);
    } else {
        print(`Collection ${col} already exists.`);
    }
});

// Create Indexes

// positions
print("Creating indexes for 'positions'...");
db.positions.createIndex({ "status": 1 });
db.positions.createIndex({ "raisedBy": 1 });
db.positions.createIndex({ "reviewerId": 1 });
db.positions.createIndex({ "lastHMActionAt": 1 });
db.positions.createIndex({ "costCentre": 1 });

// candidates
print("Creating indexes for 'candidates'...");
db.candidates.createIndex({ "positionId": 1 });
db.candidates.createIndex({ "currentStage": 1 });

// notifications
print("Creating indexes for 'notifications'...");
db.notifications.createIndex({ "recipientId": 1, "isRead": 1 });
db.notifications.createIndex({ "positionId": 1 });

// users
print("Creating indexes for 'users'...");
db.users.createIndex({ "auth0Id": 1 }, { unique: true });
db.users.createIndex({ "email": 1 });

// mrfTemplates
print("Creating indexes for 'mrfTemplates'...");
db.mrfTemplates.createIndex({ "costCentre": 1, "isActive": 1 });

print("Database initialization complete!");
