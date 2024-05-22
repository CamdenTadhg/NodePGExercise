process.env.NODE_ENV = "test";

const request = require('supertest');
const app = require('../app');
const db = require('../db');

beforeEach(async function(){
    const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ('hp', 'HP', 'hardware manufacturer')`);
    testHP = result.rows[0];
    const invoiceResult = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('hp', 250), ('hp', 500)`);
    testInvoice = invoiceResult.rows[0];
})

afterEach(async function(){
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");
})

afterAll(async function(){
    await db.end();
})

describe("GET /companies", function(){
    test("Gets a list of companies", async function(){
        const response = await request(app).get('/companies');
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({companies: [{"code": "hp", "name": "HP"}]});
    });
})

describe("GET /companies/[code]", function(){
    test("Gets an object of a single company", async function(){
        const response = await request(app).get('/companies/hp');
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({company: {"code": "hp", "name": "HP", "description": "hardware manufacturer", "invoices": [expect.any(Number), expect.any(Number)]}});
    });
    test('Returns 404 if company not found', async function(){
        const response = await request(app).get('/companies/apple');
        expect(response.statusCode).toEqual(404);
    })
})

describe("POST /companies", function(){
    test("Creates a new company", async function(){
        const response = await request(app).post('/companies').send({code: "app", name: "Apple", description: "Think Different"});
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({company: {"code": "app", "name": "Apple", "description": "Think Different"}})
    });
})

describe("PUT /companies/[code]", function(){
    test("Updates a company", async function(){
        const response = await request(app).put('/companies/hp').send({name: "Hewlett-Packard", description: "hardware manufacturer"});
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({company: {"code": "hp", "name": "Hewlett-Packard", "description": "hardware manufacturer"}});
    });
    test('Returns 404 if company not found', async function(){
        const response = await request(app).put('/companies/app').send({name: "Apple, Inc."});
        expect(response.statusCode).toEqual(404);
    });
});

describe("DELETE /companies/[code]", function(){
    test("Deletes a company", async function(){
        const response = await request(app).delete('/companies/hp');
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({"status": "deleted"});
    });
    test('Returns 404 if company not found', async function(){
        const response = await request(app).delete('/companies/app');
        expect(response.statusCode).toEqual(404);
    });
})