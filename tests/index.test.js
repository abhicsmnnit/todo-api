const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('../index');
const {Todo} = require('../models/Todo');

describe('POST /todos', () => {
    it('should successfully add todo for a valid input', (done) => {
        const text = 'This is a valid todo text!';
        request(app)
            .post('/todos')
            .send({ text })
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(text).toBeA('string');
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.find(res.body).then((todos) => {
                    expect(todos.length).toBe(1);
                    done();
                }).catch((err) => done(err));
            });
    });

    it('should not create a todo if empty data is passed', (done) => {
        request(app)
            .post('/todos')
            .send({})
            .expect(400)
            .end(done);
    });

    it('should not create a todo if `text` field is not present in data', (done) => {
        const somethingOtherThanText = 'Doesn\'t matter what goes here';
        request(app)
            .post('/todos')
            .send({ somethingOtherThanText })
            .expect(400)
            .end(done);
    });

    it('should create a todo with trimmed text if spaces are there around the text passed', (done) => {
        const text = '   Trim me!    ';
        const trimmedText = text.trim();

        request(app)
            .post('/todos')
            .send({ text })
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(trimmedText);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.find(res.body).then((todos) => {
                    expect(todos.length).toBe(1);
                    done();
                }).catch((err) => done(err));
            });
    });
});

describe('GET /todos', () => {
    it('should return all the todos', (done) => {
        request(app)
            .get('/todos')
            .expect(200)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.find().then((todos) => {
                    expect(todos.length).toBe(res.body.todos.length);
                    done();
                }).catch((err) => done(err));
            });
    });
});

describe('GET /todos/:id', () => {
    it('should return the todo', (done) => {
        Todo.findOne().then((todo) => {
            request(app)
                .get(`/todos/${todo._id}`)
                .expect(200)
                .expect((res) => {
                    // todo object returned from mongo has a lot of other properties as well apart from the one that we stored in todo
                    // So we can check for mongo's todo object to contain what the API returned
                    expect(todo).toContain(res.body.todo);
                })
                .end(done);
        }).catch((err) => done(err));
    });

    it('should give 404 for non-object id', (done) => {
        request(app)
            .get('/todos/123')
            .expect(404)
            .end(done);
    });

    it('should give 404 for valid but non-existent id', (done) => {
        const aValidID = new ObjectID().toHexString();
        request(app)
            .get(`/todos/${aValidID}`)
            .expect(404)
            .end(done);
    });
});