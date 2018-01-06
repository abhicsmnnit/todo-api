const express = require('express');
const bodyParser = require('body-parser');

const mongoose = require('./db/mongoose');
const {Todo} = require('./models/Todo');
const {User} = require('./models/User');

const app = express();

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});