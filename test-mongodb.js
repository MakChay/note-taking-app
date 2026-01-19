require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    try {
        console.log('Testing MongoDB connection...');
        console.log('Connection string:', process.env.MONGODB_URI.replace(/\/\/.*:.*@/, '//USERNAME:PASSWORD@'));
        
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ Connected to MongoDB successfully!');
        
        // List databases
        const adminDb = mongoose.connection.db.admin();
        const dbs = await adminDb.listDatabases();
        console.log('Available databases:', dbs.databases.map(db => db.name));
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.log('\n💡 Check these:');
        console.log('1. Is your password correct in .env file?');
        console.log('2. Have you added your IP to Network Access?');
        console.log('3. Is the cluster name correct? (note-app-cluster)');
        process.exit(1);
    }
}

testConnection();