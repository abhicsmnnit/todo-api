const expect = require('expect');
const request = require('supertest');

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