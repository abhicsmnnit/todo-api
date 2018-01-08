const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

const { User } = require('../models/User');

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

module.exports = { users, populateTestUsers };