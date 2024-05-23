const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");
const router = new express.Router();

router.get('/', async function(req, res, next){
    try{
        const indResults = await db.query(`SELECT code, industry FROM industries`);
        let resultsArray = [];
        for (const row of indResults.rows){ 
            compResults = await db.query(
                `SELECT ind.code, ind.industry, c.name FROM industries AS ind
                LEFT JOIN companies_industries AS ci ON ci.ind_code = ind.code
                LEFT JOIN companies AS c ON c.code = ci.comp_code
                WHERE ind.code = $1`, [row.code]);
            const {code, industry} = compResults.rows[0];
            const companies = compResults.rows.map((company) => company.name);
            const resultsObject = {code: code, industry: industry, companies: companies};
            resultsArray.push(resultsObject);
        }
        return res.status(200).json({industries: resultsArray});
    } catch(e){
        return next(e);
    }
});

router.post('/', async function(req, res, next){
    try {
        const {code, industry} = req.body;
        if (code.length === 0){
            throw new ExpressError('Code value is required', 500);
        }
        if (industry.length === 0){
            throw new ExpressError('Industry value is required', 500);
        }
        const results = await db.query('INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry', [code, industry]);
        return res.status(201).json({industry: results.rows[0]});
    } catch(e){
        return next(e);
    }
});

module.exports = router