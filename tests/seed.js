const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

const { User } = require('../models/User');
const { Todo } = require('../models/Todo');

const user1ID = new ObjectID();
const user2ID = new ObjectID();

const users = [{
    _id: user1ID,
    email: 'user1@example.com',
    password: 'qwedsa',
    tokens: [{
        access: 'auth',
        token: jwt.sign({ _id: user1ID.toHexString(), access: 'auth' }, 'tatasalt')
    }]
}, {
    _id: user2ID,
    email: 'user2@example.com',
    password: 'qwerty',
    tokens: [{
        access: 'auth',
        token: jwt.sign({ _id: user2ID.toHexString(), access: 'auth' }, 'tatasalt')
    }]
}];

const populateTestUsers = (done) => {
    User.remove({}).then(() => {
        const user1 = new User(users[0]).save();
        const user2 = new User(users[1]).save();

        return Promise.all([user1, user2]);
    }).then(() => done());
};

const todos = [{
    _id: new ObjectID(),
    text: "Always Chant Hare Krishna!",
    _creator: users[0]._id
}, {
    _id: new ObjectID(),
    text: "Read Bhagavad Gita As It Is",
    _creator: users[1]._id
}, {
    _id: new ObjectID(),
    text: "Be in Maya",
    _creator: users[1]._id,
    completed: true,
    completedAt: Math.floor(Date.now() / 1000)
}];

const populateTestTodos = (done) => {
    Todo.remove({}).then(() => {
        Todo.insertMany(todos).then(() => done());
    });
};

module.exports = { users, populateTestUsers, todos, populateTestTodos };