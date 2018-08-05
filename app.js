//Rohin - Snowplough DB
var express = require('express');
var mysql = require('./dbcon.js');

var app = express();
var handlebars = require('express-handlebars').create({defaultLayout: 'main'});
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.engine('handlebars',handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 80);


// *************************** EMPLOYEES Page ***************************
//Render home page (Employees)
app.get('/', function (req, res, next){
    var context = {};
    //Query to render the main employees table
    mysql.pool.query("SELECT eid, f_name, l_name, hourly_wage, car_number_fk FROM `employee`", function(err, rows, fields){
        if(err){
            next(err);
            return;
        }
        context.results = rows;

        //Query to render the create employee vehicle assignment list
        mysql.pool.query("SELECT plate_number, type FROM `vehicle`", function(err, rows, fields){
            if(err){
                next(err);
                return;
            }
            context.vehicles = rows;

            //Render the employees page
            res.render('home', context);
        });
        
    });
});
//Create new Employee
app.post('/insert_employees',function(req,res,next){
  mysql.pool.query("INSERT INTO employee (`f_name`, `l_name`, `hourly_wage`, `car_number_fk`) VALUES (?, ?, ?, ?)",
    [req.body.f_name || null, req.body.l_name || null, req.body.hourly_wage || '11.25', req.body.car_number_fk || null], function(err, result){
    if(err){
      next(err);
      return;
    }
    res.redirect('/');
  });
});
//Filter employee by hourly wage less than (sort ascending)
app.post('/filter_emp_lt_wage',function(req,res,next){
    var context = {};
  
    mysql.pool.query("SELECT eid, f_name, l_name, hourly_wage, car_number_fk FROM `employee` WHERE hourly_wage < ? ORDER BY hourly_wage ASC",
    [req.body.hourly_wage_input || null], function(err, result){
    if(err){
      next(err);
      return;
    }
    context.results = result;
    res.render('home', context);
  });
});
// ******************************************************************

// *************************** ROADS Page ***************************
//Render (read) Roads Page
app.get('/roads', function (req, res, next){
    var context = {};
    mysql.pool.query("SELECT id, name, length FROM `road`", function(err, rows, fields){
        if(err){
            next(err);
            return;
        }
        context.results = rows;
        res.render('roads', context);
    });
});
//Create new Road
app.post('/insert_roads',function(req, res, next){
  mysql.pool.query("INSERT INTO road (`name`, `length`) VALUES (?, ?)",
    [req.body.road_name || null, req.body.road_length || null], function(err, result){
    if(err){
      next(err);
      return;
    }
    res.redirect('/roads');
  });
});
//Delete Road
app.post('/remove_road_by_id', function (req, res, next){
    console.log("Trying to REMOVE ROAD with ID: ");
    console.log(req.body.road_id);

    mysql.pool.query("DELETE FROM `road` WHERE id=?", [req.body.road_id], function (err, result) {
        if (err) {
            next(err);
            return;
        }
        res.redirect('/roads');
    });
});
// *********************************************************************

// *************************** VEHICLES Page ***************************
//Render Vehicles page
app.get('/vehicles', function (req, res, next){
    var context = {};
      //Populate List of Roads selection for associating the vehicles to
      mysql.pool.query("SELECT id, name FROM `road`", function(err, rows, fields){
      if(err){
          next(err);
          return;
      }
      context.roadList = rows;
        //Query to render the main vehicle table
        mysql.pool.query("SELECT plate_number, type, hourly_cost, available, road_id_fk FROM `vehicle`", function(err, rows, fields){
            if(err){
                next(err);
                return;
            }
            context.results = rows;
            res.render('vehicles', context);
        });
    });
});
//Create new Vehicle         
app.post('/insert_vehicles', function(req, res, next){
  var currentQuery = "INSERT INTO vehicle (`plate_number`, `type`, `hourly_cost`, `available`, `road_id_fk`) VALUES (?, ?, ?, ?, ?)";
  var safeInsertQuery = "INSERT INTO vehicle (`plate_number`, `type`, `hourly_cost`, `available`, `road_id_fk`) " +
                        "SELECT ?, ?, ?, ?, ? " +
                        "WHERE NOT EXISTS (SELECT * FROM vehicle WHERE `plate_number` = ?)";

  mysql.pool.query(safeInsertQuery,
    [req.body.plate_number || null, req.body.car_type || null, req.body.hourly_cost || '5', req.body.available || null, req.body.road_id || null, req.body.plate_number || null], function(err, result){
    if(err){
      next(err);
      return;
    }
    res.redirect('/vehicles');
  });
});
//Update Vehicle Availability
app.post('/update_vehicles', function(req, res, next){
    // var context = {};
    mysql.pool.query("UPDATE vehicle SET available = ? WHERE plate_number = ?",
    [req.body.available_update || null, req.body.plate_number_update || null], function(err, result){
    if(err){
      next(err);
      return;
    }
    // context.results = result;
    // res.render('vehicles', context);
    res.redirect('/vehicles');
  });
});
// *********************************************************************

// **************************** SALARY Page ****************************
//Render Salary Page
app.get('/salary', function(req, res, next){
    var context = {};

    // //Variable storing SQL query used to display main table
    // var displaySalary = "SELECT emp.f_name, emp.l_name, employee_id, dep.office_name, department_id " + 
    //                     "FROM `association` ass " + 
    //                     "INNER JOIN employee emp ON ass.employee_id = emp.eid " + 
    //                     "INNER JOIN department dep ON ass.department_id = dep.id " +
    //                     "ORDER BY emp.f_name, emp.l_name, dep.office_name";
    
    //Query to populate Employee ID selection (for salary page)
    mysql.pool.query("SELECT cheque_number, amount, CAST(chq_date AS CHAR) AS chq_date_formatted, eid_fk FROM `salary`", function(err, rows, fields){
        if(err){
            next(err);
            return;
        }
        context.results = rows;
        //res.render('salary', context);


            //Query to populate Employee selection (for salary page)
            mysql.pool.query("SELECT eid, f_name, l_name FROM `employee` ORDER BY l_name, f_name ASC", function(err, rows, fields){
            if(err){
                next(err);
                return;
            }
            context.emp_list = rows;

            //RENDER the SALARY page
            res.render('salary', context);
        });
    });
});
//Create New Salary Log
app.post('/new_salary', function(req, res, next){
  mysql.pool.query("INSERT INTO salary (`chq_date`, `amount`, `eid_fk`) VALUES (?, ?, ?)",
    [req.body.chq_date || null, req.body.amount || null, req.body.employee_id || null], function(err, result){
    if(err){
      next(err);
      return;
    }
    res.redirect('/salary');
  });
});
// *********************************************************************

// ************************** DEPARTMENT Page **************************
// Render Department Page 
app.get('/department', function(req, res, next) {
    var context = {};
    mysql.pool.query("SELECT id, office_name, postal_code FROM `department`", function(err, rows, fields){
        if(err){
            next(err);
            return;
        }
        context.results = rows;
        res.render('department', context);
    });
});
//Create New Department  
app.post('/new_department', function(req, res, next){
  var currentQuery = "INSERT INTO department (`office_name`, `postal_code`) VALUES (?, ?)";
  var safeInsertQuery = "INSERT INTO department (`office_name`, `postal_code`) " +
                        "SELECT ?, ? " +
                        "WHERE NOT EXISTS (SELECT * FROM department WHERE `office_name` = ?)";
  mysql.pool.query(safeInsertQuery,
    [req.body.office_name || null, req.body.postal_code, req.body.office_name || null], function(err, result){
    if(err){
      next(err);
      return;
    }
    res.redirect('/department');
  });
});
// *********************************************************************

// ************************** ASSOCIATION Page *************************
//Render Association page (Also Populate selection list of employees and departments for joining)
app.get('/association', function (req, res, next) {
    var context = {};
    //Variable storing SQL query used to display main table
    var displayAssoc = "SELECT emp.f_name, emp.l_name, employee_id, dep.office_name, department_id " + 
                       "FROM `association` ass " + 
                       "INNER JOIN employee emp ON ass.employee_id = emp.eid " + 
                       "INNER JOIN department dep ON ass.department_id = dep.id " +
                       "ORDER BY emp.f_name, emp.l_name, dep.office_name";
    //Query to populate Employee ID selection
    mysql.pool.query("SELECT eid, f_name, l_name FROM `employee` ORDER BY l_name, f_name ASC", function(err, rows, fields){
        if(err){
            next(err);
            return;
        }
        context.emp_list = rows;

            //Query to populate Department ID selection
            mysql.pool.query("SELECT id, office_name FROM `department` ORDER BY office_name ASC", function(err, rows, fields){
            if(err){
                next(err);
                return;
            }
            context.dept_list = rows;
            
                //Render the main association table
                mysql.pool.query(displayAssoc, function(err, rows, fields){
                if(err){
                    next(err);
                    return;
                }
                context.results = rows;

                //RENDER the page
                res.render('association', context);

                // function (getSel){
                //     backupQuery = "SELECT employee_id, department_id FROM `association`";

                //     mysql.pool.query(displayAssoc, function(err, rows, fields){
                //     if(err){
                //         next(err);
                //         return;
                //     }
                //      context.updatedList = rows;
                    
                //  });
                // }
            });
        });
    });
});

//Create new association   Note: try req.body.employee_id
app.post('/new_association',function(req, res, next){

  var regularCreate = "INSERT INTO association (`employee_id`, `department_id`) VALUES (?, ?)";
  var safeCreateQueryBAK = "INSERT INTO association (`employee_id`, `department_id`) " +
                        "SELECT " + req.body.employee_id + ", " + req.body.department_id + " " +
                        "WHERE NOT EXISTS (SELECT * FROM association WHERE `employee_id` = " + req.body.employee_id + " AND `department_id` = " + req.body.department_id + ")";

  var safeCreateQuery = "INSERT INTO association (`employee_id`, `department_id`) " +
                        "SELECT ?, ? " +
                        "WHERE NOT EXISTS (SELECT * FROM association WHERE `employee_id` = ? AND `department_id` = ?)";

  mysql.pool.query(safeCreateQuery,
    [req.body.employee_id || null, req.body.department_id || null, req.body.employee_id || null, req.body.department_id || null], function(err, result){
    if(err){
      next(err);
      return;
    }
    res.redirect('/association');
  });
});

//Remove existing Association
app.post('/remove_association', function (req, res, next){
    mysql.pool.query("DELETE FROM `association` WHERE employee_id=? AND department_id=?", 
        [req.body.employee_id || null, req.body.department_id || null], function (err, result) {
        if (err) {
            next(err);
            return;
        }
        res.redirect('/association');
    });
});
// *********************************************************************


app.use(function(req,res){
    res.type('text/plain');
    res.status(404);
    res.send('404 - Not found');
});

app.use(function(err, req, res, next){
    console.error(err.stack);
    res.type('plain/text');
    res.status(500);
    res.send('500 - Server Error');
});

app.listen(app.get('port'), function(){
    console.log('Express started on Rohins Cpanel:' +app.get('port') +'; Press Ctrl-C to terminate.');
});


