process.env.NODE_ENV = "test";

const request = require('supertest');
const app = require('../app');
const db = require('../db');

beforeEach(async function(){
    await db.query(`INSERT INTO industries (code, industry) VALUES ('ag', 'Agriculture'), ('tech', 'Technology')`);
    await db.query(`INSERT INTO companies (code, name, description) VALUES ('hp', 'HP', 'hardware manufacturer')`);
    await db.query(`INSERT INTO companies_industries (comp_code, ind_code) VALUES ('hp', 'ag')`);
});

afterEach(async function(){
    await db.query('DELETE FROM companies_industries');
    await db.query('DELETE FROM companies');
    await db.query("DELETE FROM industries");
});

afterAll(async function(){
    await db.end();
});

describe('/GET industries', function(){
    test('gets a list of all industries', async function(){
        const response = await request(app).get('/industries');
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({industries:[{'code': 'ag', 'industry': 'Agriculture', 'companies': ['HP']},{'code': 'tech', 'industry': 'Technology', 'companies': [null]}]})
    });
});

describe('/POST industries', function(){
    test('adds a new industry to the database', async function(){
        const response = await request(app).post('/industries').send({'code': 'bank', 'industry': 'Banking'});
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({industry: {'code': 'bank', 'industry': 'Banking'}});
    });
});