require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');
const _ = require('lodash');

const mongoose = require('./db/mongoose');
const { Todo } = require('./models/Todo');
const { User } = require('./models/User');
const { authenticate } = require('./middleware/authenticate');

const app = express();

// For parsing json coming in our requests
app.use(bodyParser.json());

app.post('/todos', authenticate, (req, res) => {
    const todo = new Todo({
        text: req.body.text,
        _creator: req.user._id
    });
    todo.save().then((doc) => {
        res.send(doc);
    }, (error) => {
        res.status(400).send(error);
    });
});

app.get('/todos', authenticate, (req, res) => {
    Todo.find({ _creator: req.user._id })
        .then((todos) => {
            res.send({ todos });
        }, (err) => {
            res.status(400).send(err);
        });
});

app.get('/todos/:id', authenticate, (req, res) => {
    const todoId = req.params.id;
    if (!ObjectID.isValid(todoId)) {
        return res.status(404).send();
    }

    Todo.findOne({
        _id: todoId,
        _creator: req.user._id
    }).then((todo) => {
        if (!todo) {
            return res.status(404).send();
        }
        res.send({ todo });
    }).catch(err => res.status(400).send());
});

app.delete('/todos/:id', authenticate, (req, res) => {
    const todoId = req.params.id;
    if (!ObjectID.isValid(todoId)) {
        res.status(404).send();
    }

    Todo.findOneAndRemove({
        _id: todoId,
        _creator: req.user._id
    }).then((todo) => {
        if (!todo) {
            return res.status(404).send();
        }
        res.send({ todo });
    }).catch((err) => res.status(400).send());
});

app.patch('/todos/:id', (req, res) => {
    const updatedTodoId = req.params.id;
    if (!ObjectID.isValid(updatedTodoId)) {
        return res.status(404).send();
    }

    const body = _.pick(req.body, ['text', 'completed']);
    const errors = validate(body);
    if (_.size(errors) > 0) {
        return res.status(400).send({ errors });
    }

    if (body.completed === false) {
        body.completedAt = null;
    } else if (body.completed === true) {
        body.completedAt = Math.floor(Date.now() / 1000);
    }

    Todo.findByIdAndUpdate(updatedTodoId, { $set: body }, { new: true })
        .then((todo) => {
            if (!todo) {
                res.status(404).send();
            }
            res.send({ todo });
        }).catch(err => res.status(400).send());
});

const validate = (body) => {
    const errors = {};
    if (_.has(body, 'text') && !isValidText(body.text)) {
        _.set(errors, 'text', 'must be a non-empty string');
    }
    if (_.has(body, 'completed') && !_.isBoolean(body.completed)) {
        _.set(errors, 'completed', 'must be a boolean');
    }
    return errors;
};

const isValidText = (text) => _.isString(text) && text.trim().length > 0;

app.post('/users', (req, res) => {
    const userDetails = _.pick(req.body, ['email', 'password']);
    const user = new User(userDetails);

    user.save()
        .then(savedUser => savedUser.generateAuthToken())
        .then(token => res.header('x-auth-token', token).send({ user }))
        .catch(err => res.status(400).send(err));
});

app.get('/users/me', authenticate, (req, res) => {
    res.send({ user: req.user });
});

app.post('/users/login', (req, res) => {
    const userDetails = _.pick(req.body, ['email', 'password']);
    User.findByCredentials(userDetails.email, userDetails.password)
        .then(user => {
            return user.generateAuthToken()
                .then(token => res.header('x-auth-token', token).send({ user }));
        })
        .catch(err => res.status(400).send());
});

app.delete('/users/me/token', authenticate, (req, res) => {
    const user = req.user;

    user.removeToken(req.token)
        .then(() => res.send())
        .catch(err => res.status(400).send());
});

const port = process.env.PORT;
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

module.exports = { app };