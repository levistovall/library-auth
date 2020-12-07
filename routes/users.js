var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController');
var cors = require('cors')

var allowlist = ['http://'+process.env.GUI_IP+':'+process.env.GUI_PORT];
var corsOptionsDelegate = function (req, callback) {
    console.log("cors stuff "+req.header('Origin')+" vs "+allowlist[0]);
    var corsOptions;
    if (allowlist.indexOf(req.header('Origin')) !== -1) {
        console.log("found");
        corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
    } else {
        console.log("not found");
        corsOptions = { origin: false } // disable CORS for this request
    }
    callback(null, corsOptions) // callback expects two parameters: error and options
}

/* GET users listing. */
router.get('/', function(req, res, next) {
        res.send('respond with a resource');
        });

router.get('/cool', function(req, res, next) {
        res.send('You\'re so cool');
        });


router.post('/signup', userController.signup);

router.post('/login', cors(corsOptionsDelegate), userController.login);

router.get('/user/:userId', userController.allowIfLoggedin, userController.getUser);

router.get('/users', userController.allowIfLoggedin, userController.grantAccess('readAny', 'profile'), userController.getUsers);

router.put('/user/:userId', userController.allowIfLoggedin, userController.grantAccess('updateAny', 'profile'), userController.updateUser);

router.delete('/user/:userId', userController.allowIfLoggedin, userController.grantAccess('deleteAny', 'profile'), userController.deleteUser);

module.exports = router;
