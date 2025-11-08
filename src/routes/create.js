/**
 * Game Routes
 *
 * Routes connect HTTP requests to controller functions.
 *
 *
 * router.get('/', indexController.getHome);
 * router.get('/about', indexController.getAbout);
 *
 * module.exports = router;
 */

const express = require('express');
const router = express.Router();
const createController = require('../controllers/createController');
const { addGame } = require('../controllers/createController');
router.get('/', createController.loadCreate);
router.post('/add', createController.addGame);

// Import controllers
// const indexController = require('../controllers/indexController');

// Define routes
// router.get('/', indexController.getHome);

// dummy comment

module.exports = router;
