const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");
const router = new express.Router();
const slugify = require('slugify');

router.get('/', async function(req, res, next){
    try{
        const results = await db.query('SELECT code, name FROM companies');
        return res.json({companies: results.rows});
    } catch(e){
        return next(e);
    }
});

router.get('/:code', async function(req, res, next){
    try{
        const invResults = await db.query(
            `SELECT c.code, c.name, c.description, i.id FROM companies AS c
            LEFT JOIN invoices AS i ON c.code = i.comp_code
            WHERE c.code = $1`, [req.params.code]);
        if (invResults.rows.length === 0){
            throw new ExpressError(`Can't find company with code of ${req.params.code}`, 404);
        }
        const indResults = await db.query(
            `SELECT c.code, c.name, c.description, ind.industry FROM companies AS c
            LEFT JOIN companies_industries AS ci ON c.code = ci.comp_code
            INNER JOIN industries AS ind ON ind.code = ci.ind_code
            WHERE c.code = $1`, [req.params.code]);
        const {code, name, description} = invResults.rows[0];
        const invoices = invResults.rows.map((invoice) => invoice.id);
        const industries = indResults.rows.map((industry) => industry.industry)
        return res.json({company: {code, name, description, invoices: invoices, industries: industries}});
    } catch(e){
        return next(e);
    }
});

router.post('/', async function(req, res, next){
    try {
        const {name, description} = req.body;
        if (name.length === 0){
            throw new ExpressError('Name value is required', 500);
        }
        const code = slugify(name, {replacement: '', remove: /[*+~.()'"!:@]/g, lower: true, strict: true});
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

router.post('/:code/industry', async function(req, res, next){
    try{
        const ind_code = req.body.code;
        const comp_code = req.params.code;
        const indResults = await db.query('SELECT code FROM industries WHERE code = $1', [ind_code])
        if (indResults.rows.length === 0){
            throw new ExpressError(`Can't find industry with code of ${ind_code}`, 404);
        }
        const compResults = await db.query('SELECT code FROM companies WHERE code = $1', [comp_code])
        if (compResults.rows.length === 0){
            throw new ExpressError(`Can't find company with code of ${comp_code}`, 404);
        }
        const association = await db.query('INSERT INTO companies_industries (comp_code, ind_code) VALUES ($1, $2) RETURNING comp_code, ind_code', [comp_code, ind_code]);
        if (association.rows.length === 0){
            throw new ExpressError('Association not created', 500);
        }
        const invResults = await db.query(
            `SELECT c.code, c.name, c.description, i.id FROM companies AS c
            LEFT JOIN invoices AS i ON c.code = i.comp_code
            WHERE c.code = $1`, [comp_code]);
        const industryResults = await db.query(
            `SELECT c.code, c.name, c.description, ind.industry FROM companies AS c
            LEFT JOIN companies_industries AS ci ON c.code = ci.comp_code
            INNER JOIN industries AS ind ON ind.code = ci.ind_code
            WHERE c.code = $1`, [comp_code]);
        const {code, name, description} = invResults.rows[0];
        const invoices = invResults.rows.map((invoice) => invoice.id);
        const industries = industryResults.rows.map((industry) => industry.industry)
        return res.json({company: {code, name, description, invoices: invoices, industries: industries}});
    } catch(e) {
        return next(e);
    }
})

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