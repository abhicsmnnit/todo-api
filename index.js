const express = require('express');
const bodyParser = require('body-parser');

const mongoose = require('./db/mongoose');
const {Todo} = require('./models/Todo');
const {User} = require('./models/User');

const app = express();

// For parsing json coming in our requests
app.use(bodyParser.json());

app.post('/todos', (req, res) => {
    const todo = new Todo({
        text: req.body.text
    });
    todo.save().then((doc) => {
        console.log('Saved!');
        res.send(doc);
    }, (error) => {
        console.log('Unable to save!');
        res.status(400).send(error);
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});