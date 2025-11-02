/**
 * User Controller
 *
 * Handles user-related operations:
 * - Registration
 * - Login/Logout
 * - Profile management
 * - Authentication
 */

// Import models
// const User = require('../models/User');

/**
 * GET /users/register
 * Display registration form
 */
exports.getRegister = (req, res) => {
  res.render('register', {
    user: req.session.user,
    title: 'Register',
    error: null
  });
};

/**
 * POST /users/register
 * Process registration form
 */
exports.postRegister = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    console.log('Username:', username, 'Password:', password);

    //Basic password checking
    if (password.length < 6) {
      return res.render('register', {
        title: 'Register',
        error: 'Password must be at least 6 characters long.',
        user: req.session.user, 
        csrfToken: req.session.csrfToken,
      });
    }

    //If it's valid, create a user profile (very basic at this point)
    req.session.user = {
      username,
      password,
      creation: Date.now(),
    };

    return res.redirect('/');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /users/login
 * Display login form
 */
exports.getLogin = (req, res) => {
  res.render('login', {
    user: req.session.user,
    title: 'Login',
  });
};

/**
 * POST /users/login
 * Process login form
 */
exports.postLogin = (req, res, next) => {
  try {
    const { username, password } = req.body;
    console.log('Username:', username, 'Password:', password);

    //Redirects to home after logging in, sets account variables
    if (username && password) {
      req.session.user = { username, password };
      req.session.user.creation = Date.now();
      req.session.user.gamesPlayed = 0;
      req.session.user.right = 0;
      req.session.user.wrong = 0;
      return res.redirect('/');
    }

    // Just in case, requires the user to login again
    return res.redirect('/login');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /users/logout
 * Logout user
 */
exports.postLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
};

exports.getProfile = (req, res) => {
  const user = req.session.user;

  const creationDate = new Date(req.session.user.creation).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let ratio = 0;

  if(req.session.user.wrong > 0) {
    ratio = ((req.session.user.right / (req.session.user.wrong + req.session.user.right)) * 100);
    ratio = ratio.toFixed(2);
  }
  

  res.render('profile', {
    title: 'Profile',
    user: user.username,
    date: creationDate,
    csrfToken: req.session.csrfToken,
    total: req.session.user.gamesPlayed,
    right: req.session.user.right,
    wrong: req.session.user.wrong,
    ratio: ratio || 0
  });
};

// Add more controller methods as needed
