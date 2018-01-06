const mongoose = require('mongoose');

// Tell Mongoose to use the JS Promises (not any other 3rd-Party Promise Library like BlueBird)
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/TodoApp');

module.exports = {mongoose};