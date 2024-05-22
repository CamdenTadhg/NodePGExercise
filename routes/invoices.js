const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");
const router = new express.Router();

router.get('/', async function(req, res, next){
    try{
        const results = await db.query('SELECT id, comp_code FROM invoices');
        return res.json({invoices: results.rows});
    } catch(e) {
        return next(e);
    }
});

router.get('/:id', async function(req, res, next){
    try{
        const results = await db.query(`SELECT * FROM invoices INNER JOIN companies ON companies.code = invoices.comp_code WHERE id = $1`, [req.params.id]);
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find invoice with id of ${req.params.id}`, 404);
        }
        const {id, amt, paid, add_date, paid_date, code, name, description} = results.rows[0];
        return res.json({invoice: {
            id, amt, paid, add_date, paid_date, 
            company: {code, name, description}} 
             });
    } catch(e) {
        return next(e);
    }
});

router.post('/', async function(req, res, next){
    try{
        const {comp_code, amt} = req.body;
        if (comp_code.length === 0){
            throw new ExpressError(`Company code value is required`, 500);
        }
        if (amt.length === 0){
            throw new ExpressError('Amount value is required', 500);
        }
        const results = await db.query('INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date', [comp_code, amt]);
        return res.status(201).json({invoice: results.rows[0]});
    } catch(e) {
        return next(e);
    }
});

router.put('/:id', async function(req, res, next){
    try{
        const {amt, paid} = req.body;
        if (amt.length === 0){
            throw new ExpressError('Amount values is required', 500);
        }
        const {id} = req.params;
        let paid_date;
        const invoice = await db.query('SELECT paid_date FROM invoices WHERE id = $1', [id]);
        if (paid === true && invoice.rows[0].paid_date === null){
            paid_date = new Date();
        }
        else if (paid === false){
            paid_date = null;
        }
        else if (paid === true && invoice.rows[0].paid_date !== null){
            paid_date = invoice.rows[0].paid_date;
        }
        const results = await db.query('UPDATE invoices SET amt = $1, paid = $4, paid_date = $3 WHERE id = $2 RETURNING id, comp_code, amt, paid, add_date, paid_date', [amt, id, paid_date, paid]);
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
        }
        return res.json({invoice: results.rows[0]});
    } catch(e) {
        return next(e);
    }
});

router.delete('/:id', async function(req, res, next){
    try {
        const {id} = req.params;
        const results = await db.query('DELETE FROM invoices WHERE id = $1 RETURNING id', [id]);
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
        }
        return res.json({status: "deleted"});
    } catch(e) {
        return next(e);
    }
});

module.exports = router