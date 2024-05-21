const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");
const router = new express.Router();

router.get('/', async function(req, res, next){
    try{
        const results = await db.query('SELECT * FROM companies');
        return res.json({companies: results.rows});
    } catch(e){
        return next(e);
    }
});

router.get('/:code', async function(req, res, next){
    try{
        const {code} = req.params;
        const results = await db.query('SELECT * FROM companies INNER JOIN invoices ON companies.code = invoices.comp_code WHERE code = $1', [code]);
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find company with code of ${code}`, 404);
        }
        const {results_code, name, description} = results.rows[0];
        const invoices = results.rows.map((invoice) => invoice.id);
        return res.json({company: {results_code, name, description, invoices: invoices}});
    } catch(e){
        return next(e);
    }
});

router.post('/', async function(req, res, next){
    try {
        const {code, name, description} = req.body;
        if (code.length === 0){
            throw new ExpressError(`Code value is required`, 500);
        }
        if (name.length === 0){
            throw new ExpressError('Name value is required', 500);
        }
        const results = await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description', [code, name, description]);
        return res.status(201).json({company: results.rows[0]});
    } catch(e){
        return next(e);
    }
});

router.put('/:code', async function(req, res, next){
    try{
        const {name, description} = req.body;
        const {code} = req.params;
        if (name.length === 0){
            throw new ExpressError('Name value is required', 500);
        }
        const results = await db.query(`UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING code, name, description`, [name, description, code]);
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find company with code of ${code}`, 404);
        }
        return res.json({company: results.rows[0]});
    } catch(e) {
        return next(e);
    }
});

router.delete('/:code', async function(req, res, next){
    try{
        const {code} = req.params;
        const results = await db.query('DELETE FROM companies WHERE code = $1 RETURNING code', [code]);
        if (results.rows.length === 0){
            throw new ExpressError(`Can't find company with code of ${code}`, 404);
        }
        return res.json({status: "deleted"});
    } catch(e){
        return next(e);
    }
});

module.exports = router