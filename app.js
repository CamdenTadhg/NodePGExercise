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


// create GET /invoices route
//create GET /invoices/[id] route
// create POST /invoices route
// create PUT /invoices/[id] route
// create DELETE /invoices/[id] route
// revise GET /companies/[code] route