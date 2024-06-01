const mongoose = require('mongoose');
require('dotenv').config();

module.exports = connection => {
    const databaseURL = process.env.DATABASE_URL;

    mongoose.connect(databaseURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => {
        console.log("Database connected successfully");
    }).catch(error => {
        console.error("Error connecting to database:", error);
        // You might want to add additional error handling or retry logic here
        process.exit(1); // Exit the application if the connection fails
    });
};
