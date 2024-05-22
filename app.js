/** BizTime express application. */
const express = require("express");
const db = require('./db');

const app = express();
const ExpressError = require("./expressError")

app.use(express.json());

/** Companies routes */
const cRoutes = require('./routes/companies');
app.use('/companies', cRoutes);
const iRoutes = require('./routes/invoices');
app.use('/invoices', iRoutes);

/** 404 handler */

app.use(function(req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message
  });
});


module.exports = app;

//write tests
//slugify company names
//allow paying of invoices
//write test for paying of invoices
//add industries many-to-many feature
//write tests for industries feature