process.env.NODE_ENV = "test";

const request = require('supertest');
const app = require('../app');
const db = require('../db');
const today = '2024-05-23'

beforeEach(async function(){
    const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ('hp', 'HP', 'hardware manufacturer')`);
    testHP = result.rows[0];
    const invoiceResult = await db.query(`INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ('hp', 250, false, null), ('hp', 500, true, DATE '2015-12-17')`);
    testInvoice = invoiceResult.rows[0];
})

afterEach(async function(){
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");
})

afterAll(async function(){
    await db.end();
})

describe("GET /invoices", function(){
    test('returns all invoices', async function(){
        const response = await request(app).get('/invoices');
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({"invoices": [{'id': expect.any(Number), "comp_code": "hp"}, {'id': expect.any(Number), "comp_code": "hp"}]});
    });
})

describe("GET /invoices/[id]", function(){
    test("returns a single invoice's details", async function(){
        const idResult = await db.query('SELECT id FROM invoices WHERE amt = 250');
        const id = idResult.rows[0].id;
        const response = await request(app).get(`/invoices/${id}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({"invoice": {"id": id, "amt": 250, "paid": false, "add_date": expect.stringContaining(today), "paid_date": null, "company": {"code": "hp", "name": "HP", "description": "hardware manufacturer"}}})
    });
    test('returns 404 when invoice is not found', async function(){
        const response = await request(app).get('/invoices/0');
        expect(response.statusCode).toEqual(404);
    });
});

describe("POST /invoices", function(){
    test('Creates a new invoice', async function(){
        const response = await request(app).post('/invoices').send({"comp_code": "hp", "amt": 1000});
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({"invoice": {"id": expect.any(Number), "comp_code": "hp", "amt": 1000, "paid": false, "add_date": expect.stringContaining(today), "paid_date": null}});
    });
});

describe("PUT /invoices/[id]", function(){
    test('Updates an invoice amount', async function(){
        const idResult = await db.query('SELECT id FROM invoices WHERE amt = 250');
        const id = idResult.rows[0].id;
        const response = await request(app).put(`/invoices/${id}`).send({"amt": 1000, "paid": false});
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({"invoice": {"id": id, "comp_code": "hp", "amt": 1000, "paid": false, "add_date": expect.stringContaining(today), "paid_date": null}});
    });
    test('Updates an invoice to paid', async function(){
        const idResult = await db.query('SELECT id FROM invoices WHERE amt = 250');
        const id = idResult.rows[0].id;
        const response = await request(app).put(`/invoices/${id}`).send({"amt": 250, "paid": true});
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({"invoice": {"id": id, "comp_code": "hp", "amt": 250, "paid": true, "add_date": expect.stringContaining(today), "paid_date": expect.stringContaining(today)}})
    });
    test("Updates an invoice to unpaid", async function(){
        const idResult = await db.query('SELECT id FROM invoices WHERE amt = 500');
        const id = idResult.rows[0].id;
        const response = await request(app).put(`/invoices/${id}`).send({"amt": 500, "paid": false});
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({"invoice": {"id": id, "comp_code": "hp", "amt": 500, "paid": false, "add_date": expect.stringContaining(today), "paid_date": null}});
    });
    test('Preserves original paid_date on update', async function(){
        const idResult = await db.query('SELECT id FROM invoices WHERE amt = 500');
        const id = idResult.rows[0].id;
        const response = await request(app).put(`/invoices/${id}`).send({"amt": 500, "paid": true});
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({"invoice": {"id": id, "comp_code": "hp", "amt": 500, "paid": true, "add_date": expect.stringContaining(today), "paid_date": expect.stringContaining('2015-12-17')
        }})
    })
    test('Returns 404 when invoice is not found', async function(){
        const response = await request(app).put('/invoices/0').send({"amt": 1000});
        expect(response.statusCode).toEqual(404);
    });
});

describe('DELETE /invoices/[id]', function(){
    test('Deletes an invoice', async function(){
        const idResult = await db.query('SELECT id FROM invoices WHERE amt = 250');
        const id = idResult.rows[0].id;
        const response = await request(app).delete(`/invoices/${id}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({"status": "deleted"});
    });
    test('Returns 404 when invoice is not found', async function(){
        const response = await request(app).delete('/invoices/0');
        expect(response.statusCode).toEqual(404);
    });
});