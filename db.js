/** Database setup for BizTime. */

const {Client} = require('pg');

function getDatabaseUri(){
    return (process.env.NODE_ENV === "test")
        ? "postgres://camdentadhg:password@127.0.0.1:5432/biztime_test"
        : process.env.DATABASE_URL || "postgres://camdentadhg:password@127.0.0.1:5432/biztime"
}

let db = new Client({
    connectionString: getDatabaseUri()
});

db.connect();

module.exports = db;