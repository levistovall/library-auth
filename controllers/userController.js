// server/controllers/userController.js
const {parse, stringify} = require('flatted');
const { body,validationResult } = require('express-validator');
const { roles } = require('../access/roles')

const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const util = require('util');

async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

async function validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
}

exports.checkLoggedInStatus = async (req, res, next) => {
    if (req.headers["x-access-token"]) {
        const accessToken = req.headers["x-access-token"];
        const { userId, exp } = await jwt.verify(accessToken, process.env.JWT_SECRET);
        // Check if token has expired
        if (exp < Date.now().valueOf() / 1000) { 
            return res.status(401).json({ error: "JWT token has expired, please login to obtain a new one" });
        } 
        res.locals.loggedInUser = await User.findById(userId);
        next(); 
    } else { 
        next(); 
    } 
};

exports.grantAccess = function(action, resource) {
    return async (req, res, next) => {
        try {
            const permission = roles.can(req.user.role)[action](resource);
            if (!permission.granted) {
                return res.status(401).json({
                    error: "You don't have enough permission to perform this action"
                });
            }
            next()
        } catch (error) {
            next(error);
        }
    }
}

exports.allowIfLoggedin = async (req, res, next) => {
    try {
        const user = res.locals.loggedInUser;
        if (!user)
            //res.render('');
            return res.status(401).json({
                error: "You need to be logged in to access this route"
            });
            req.user = user;
            next();
        
    } catch (error) {
        next(error);
    }
}

exports.signup = [
    body('email', 'Email must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('password', 'Password must not be empty.').trim().isLength({ min: 1 }).escape(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(500).json({ errors: errors.array() });
        }
        try {
            const { email, password, role } = req.body;
            console.warn('password is '+password);
            const hashedPassword = await hashPassword(password);
            const newUser = new User({ email, password: hashedPassword, role: role || "member" });
            const accessToken = jwt.sign(
                    { userId: newUser._id }, 
                    process.env.JWT_SECRET, 
                    { expiresIn: "1d" });
            newUser.accessToken = accessToken;
            await newUser.save();
            res.json({ data: newUser, accessToken })
        } catch (error) {
            next(error)
        }
    }
] 

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return next(new Error('Email does not exist'));

        const validPassword = await validatePassword(password, user.password);
        if (!validPassword) return next(new Error('Password is not correct'))
            const accessToken = jwt.sign(
                    { userId: user._id }, 
                    process.env.JWT_SECRET, 
                    { expiresIn: "1d" });

        await User.findByIdAndUpdate(user._id, { accessToken });
        res.status(200).json(
                { data: { email: user.email, role: user.role },
                accessToken })
    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

exports.getUsers = async (req, res, next) => {
    const users = await User.find({});
    res.status(200).json({ data: users });
}

exports.getUser = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);
        if (!user) return next(new Error('User does not exist'));

        res.status(200).json({ data: user });
    } catch (error) {
        next(error)
    }
}

exports.updateUser = async (req, res, next) => {
    try {
        const update = req.body;
        const userId = req.params.userId;
        await User.findByIdAndUpdate(userId, update);
        const user = await User.findById(userId);
        res.status(200).json({ data: user, message: 'User has been updated' });
    } catch (error) {
        next(error)
    }
}

exports.deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        await User.findByIdAndDelete(userId);
        res.status(200).json({ data: null, message: 'User has been deleted' });
    } catch (error) {
        next(error)
    }
}

