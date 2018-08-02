var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : '',
  user            : '',
  password        : '',
  port        	  : '',
  database        : ''
});

module.exports.pool = pool;