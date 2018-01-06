const mongoose = require('mongoose');

// Tell Mongoose to use the JS Promises (not any other 3rd-Party Promise Library like BlueBird)
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/TodoApp');

const Todo = mongoose.model('Todo', {
    text: {
        type: String
    },
    completed: {
        type: Boolean
    },
    completedAt: {
        type: Number
    }
});

const todo = new Todo({
    text: 'Chant Hare Krishna'
});

todo.save().then((doc) => {
    console.log('Saved todo', doc);
}, (err) => {
    console.log('Unable to save the todo.');
});

const todo1 = new Todo({
    text: 'Read Bhagavad Gita',
    completed: false,
    completedAt: Math.floor(Date.now() / 1000)
});

todo1.save().then((doc) => {
    console.log('Saved todo', doc);
}, (err) => {
    console.log('Unable to add todo.');
});