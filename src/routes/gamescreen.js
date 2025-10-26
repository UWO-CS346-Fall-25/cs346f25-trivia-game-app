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
const gameController = require('../controllers/gameController');
router.get('/:category', gameController.loadGame);
router.post('/:category/check', gameController.checkAnswer);

// Import controllers
// const indexController = require('../controllers/indexController');

// Define routes
// router.get('/', indexController.getHome);

// dummy comment

module.exports = router;
