const mongoose = require('mongoose');

// Tell Mongoose to use the JS Promises (not any other 3rd-Party Promise Library like BlueBird)
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/TodoApp');

const Todo = mongoose.model('Todo', {
    text: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Number,
        default: null
    }
});

const User = mongoose.model('User', {
    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    }
});

const user = new User({
    email: 'abhicsmnnit@gmail.com'
});

user.save().then((doc) => {
    console.log('User created', doc);
}, (err) => {
    console.log('Unable to create user', err);
});