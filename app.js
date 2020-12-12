var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
const bodyParser = require('body-parser');
require("dotenv").config({
 path: path.join(__dirname, "./.env")
});

var usersRouter = require('./routes/users');

var app = express();

var mongoose = require('mongoose');
var mongoDB = process.env.MONGO_LOGIN_STRING;
mongoose.connect(mongoDB, { useNewUrlParser: true , useUnifiedTopology: true}).then(console.info("mongo login success"));
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('./controllers/userController').checkLoggedInStatus);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500).json({ error: err });
});

module.exports = app;
