const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.mongoURI);
        console.log(`MongoDB Connected: ${conn.connection.host} |  ${new Date().toLocaleString()}`);
        console.log(`Database Name: ${conn.connection.name}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;