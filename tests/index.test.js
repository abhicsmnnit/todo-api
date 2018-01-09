require('../config/config');

const expect = require('expect');
const request = require('supertest');
const _ = require('lodash');
const { ObjectID } = require('mongodb');

const { app } = require('../index');
const { Todo } = require('../models/Todo');
const { User } = require('../models/User');
const { users, populateTestUsers, todos, populateTestTodos } = require('./seed');

beforeEach(populateTestUsers);
beforeEach(populateTestTodos);

describe('POST /todos', () => {
    it('should successfully add todo for a valid input', (done) => {
        const text = 'This is a valid todo text!';
        const _creator = users[0]._id;
        request(app)
            .post('/todos')
            .set('x-auth-token', users[0].tokens[0].token)
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
            .expect(401)
            .end(done);
    });

    it('should not create a todo if `text` field is not present in data', (done) => {
        const somethingOtherThanText = 'Doesn\'t matter what goes here';
        request(app)
            .post('/todos')
            .send({ somethingOtherThanText })
            .expect(401)
            .end(done);
    });

    it('should create a todo with trimmed text if spaces are there around the text passed', (done) => {
        const text = '   Trim me!    ';
        const trimmedText = text.trim();
        const _creator = users[0]._id;

        request(app)
            .post('/todos')
            .set('x-auth-token', users[0].tokens[0].token)
            .send({ text, _creator })
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
    it('should return all the todos of the authenticated', (done) => {
        request(app)
            .get('/todos')
            .set('x-auth-token', users[0].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                expect(res.body.todos.length).toBe(1);
                done();
            });
    });
});

describe('GET /todos/:id', () => {
    it('should return the todo', (done) => {
        request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .set('x-auth-token', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo._id).toBe(todos[0]._id.toHexString());
            })
            .end(done);
    });

    it('should not return todo of another user', (done) => {
        request(app)
            .get(`/todos/${todos[1]._id.toHexString()}`)
            .set('x-auth-token', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should give 404 for non-object id', (done) => {
        request(app)
            .get('/todos/123')
            .set('x-auth-token', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should give 404 for valid but non-existent id', (done) => {
        const aValidID = new ObjectID().toHexString();
        request(app)
            .get(`/todos/${aValidID}`)
            .set('x-auth-token', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

describe('DELETE /todos/:id', () => {
    it('should delete todo', (done) => {
        request(app)
            .delete(`/todos/${todos[2]._id.toHexString()}`)
            .set('x-auth-token', users[1].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo._id).toBe(todos[2]._id.toHexString());
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.findById(todos[2]._id.toHexString()).then((todo) => {
                    expect(todo).toNotExist();
                    done();
                }).catch((err) => done(err));
            });
    });

    it('should not delete todo of another user', (done) => {
        request(app)
            .delete(`/todos/${todos[1]._id.toHexString()}`)
            .set('x-auth-token', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 for non-object id', (done) => {
        request(app)
            .delete('/todos/123')
            .set('x-auth-token', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 for non-exitent id', (done) => {
        const aValidID = new ObjectID().toHexString();
        request(app)
            .delete(`/todos/${aValidID}`)
            .set('x-auth-token', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

describe('PATCH /todos/:id', () => {
    it('should update the todo', (done) => {
        const updatedTodoId = todos[0]._id.toHexString();

        const text = `${todos[0].text}, plus do this too!`;
        const completed = !todos[0].completed;
        const updateThese = { text, completed };

        request(app)
            .patch(`/todos/${updatedTodoId}`)
            .set('x-auth-token', users[0].tokens[0].token)
            .send(updateThese)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(text);
                expect(res.body.todo.completed).toBe(completed);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.findById(updatedTodoId).then((todo) => {
                    expect(todo.text).toBe(text);
                    expect(todo.completed).toBe(completed);
                    done();
                }).catch(err => done(err));
            });
    });

    it('should not update todo of another user; should return 404 instead', (done) => {
        request(app)
            .patch(`/todos/${todos[1]._id.toHexString()}`)
            .set('x-auth-token', users[0].tokens[0].token)
            .send({ text: 'A valid todo text' })
            .expect(404)
            .end(done);
    });

    it('should not update a todo if an empty object is passed', (done) => {
        request(app)
            .patch(`/todos/${todos[0]._id.toHexString()}`)
            .set('x-auth-token', users[0].tokens[0].token)
            .send({})
            .expect(200)
            .expect((res) => {
                expect(todos[0]._id.toHexString()).toBe(res.body.todo._id);
                expect(todos[0]._creator.toHexString()).toBe(res.body.todo._creator);
                expect(todos[0].text).toBe(res.body.todo.text);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.findById(todos[0]._id.toHexString()).then((todo) => {
                    expect(todo).toContain(todos[0]);
                    done();
                }).catch(err => done(err));
            });
    });

    it('should clear off `completedAt` property if a todo is marked not completed', (done) => {
        expect(todos[2].completedAt).toBeA('number');
        expect(todos[2].completed).toBe(true);

        request(app)
            .patch(`/todos/${todos[2]._id.toHexString()}`)
            .set('x-auth-token', users[1].tokens[0].token)
            .send({ completed: false })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.completedAt).toNotExist();
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.findById(todos[2]._id.toHexString()).then((todo) => {
                    expect(todo.completedAt).toNotExist();
                    done();
                }).catch(err => done(err));
            });
    });

    it('should set `completedAt` property if a todo is marked completed', (done) => {
        const todo = todos[0];

        request(app)
            .patch(`/todos/${todo._id.toHexString()}`)
            .set('x-auth-token', users[0].tokens[0].token)
            .send({ completed: true })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.completedAt).toBeA('number');
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.findById(todo._id.toHexString()).then((todo2) => {
                    expect(todo2.completedAt).toBeA('number');
                    done();
                }).catch(err => done(err));
            });
    });

    it('should return 404 for non-object id', (done) => {
        request(app)
            .patch('/todos/123')
            .set('x-auth-token', users[1].tokens[0].token)
            .send({})
            .expect(404)
            .end(done);
    });

    it('should return 404 for non-existent id', (done) => {
        const aValidID = new ObjectID().toHexString();
        request(app)
            .patch(`/todos/${aValidID}`)
            .set('x-auth-token', users[1].tokens[0].token)
            .send({})
            .expect(404)
            .end(done);
    });

    it('should return 400 with proper errors if invalid fields are passed', (done) => {
        const aValidID = new ObjectID().toHexString();
        request(app)
            .patch(`/todos/${aValidID}`)
            .set('x-auth-token', users[1].tokens[0].token)
            .send({ text: '', completed: 123 })
            .expect(400)
            .expect((res) => {
                expect(res.body).toContainKey('errors');
                expect(res.body.errors).toContainKeys(['text', 'completed']);
            })
            .end(done);
    });
});

describe('GET /users/me', () => {
    it('should return user if authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth-token', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.user._id).toBe(users[0]._id.toHexString());
                expect(res.body.user.email).toBe(users[0].email);
            })
            .end(done);
    });

    it('should return 401 if not authenticated', (done) => {
        request(app)
            .get('/users/me')
            .expect(401)
            .end(done);
    });
});

describe('POST /users', () => {
    it('should create user', (done) => {
        const email = 'test@example.com';
        const password = 'qwerty';
        request(app)
            .post('/users')
            .send({ email, password })
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth-token']).toExist();
                expect(res.body.user._id).toExist();
                expect(res.body.user.email).toBe(email);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                User.findById(res.body.user._id).then((user) => {
                    expect(user).toExist();
                    expect(user.password).toNotBe(password);
                    done();
                }).catch(err => done(err));
            });
    });

    it('should return 400 for invalid request', (done) => {
        request(app)
            .post('/users')
            .send({ email: '123', password: 'qwedsa' })
            .expect(400)
            .end(done);
    });

    it('should return 400 if email already exists', (done) => {
        request(app)
            .post('/users')
            .send({ email: users[0].email, password: 'asdfgh' })
            .expect(400)
            .end(done);
    });
});

describe('POST /users/login', () => {
    it('should return user with token in header', (done) => {
        request(app)
            .post('/users/login')
            .send({ email: users[0].email, password: users[0].password })
            .expect(200)
            .expect((res) => {
                expect(res.body.user.email).toBe(users[0].email);
                expect(res.body.user._id).toBe(users[0]._id.toHexString());
                expect(res.headers['x-auth-token']).toExist();
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                User.findById(users[0]._id).then((user) => {
                    if (!user) {
                        return done(err);
                    }
                    expect(user.tokens[1]).toInclude({
                        access: 'auth',
                        token: res.headers['x-auth-token']
                    });
                    done();
                }).catch(err => done(err));
            });
    });

    it('should return 400 if user does not exist', (done) => {
        request(app)
            .post('/users/login')
            .send({ email: 'notauser@example.com', password: 'doesntmatter' })
            .expect(400)
            .end(done);
    });
});

describe('DELETE /users/me/token', () => {
    it('should delete a token if user logged-in', (done) => {
        request(app)
            .delete('/users/me/token')
            .set('x-auth-token', users[0].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    done(err);
                }
                User.findById(users[0]._id).then((user) => {
                    if (!user) {
                        return done(err);
                    }
                    expect(user.tokens.length).toBe(0);
                    done();
                }).catch(err => done(err));
            });
    });

    it('should return 401 if not authenticated', (done) => {
        request(app)
            .delete('/users/me/token')
            .expect(401)
            .end(done);
    });
});