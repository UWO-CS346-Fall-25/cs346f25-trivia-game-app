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
const { contentSecurityPolicy } = require('helmet');
const supabase = require('../supabase');
const bcrypt = require('bcrypt');

/**
 * GET /users/register
 * Display registration form
 */
exports.getRegister = (req, res) => {
  res.render('register', {
    user: req.session.user,
    title: 'Register',
    error: null,
    csrfToken: req.csrfToken()
  });
};

/**
 * POST /users/register
 * Process registration form
 */
exports.postRegister = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    //Basic password checking
    if (password.length < 6) {
      return res.render('register', {
        title: 'Register',
        error: 'Password must be at least 6 characters long.',
        user: req.session.user,
        csrfToken: req.csrfToken()
      });
    }

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!validEmail.test(email)) {
      return res.render('register', {
        title: 'Register',
        error: 'Enter a valid email',
        user: req.session.user,
        csrfToken: req.csrfToken()
      });
    }

    //If it's valid, hash password and store data
    let hashedPassword = await bcrypt.hash(password, 10);
    const { data, error: insertionError } = await supabase
      .from('users')
      .insert([
              { username: username, email: email, password_hash: hashedPassword },
          ])
      .select();

    req.session.user = {
      username,
      creation: Date.now(),
    };

    if (insertionError) {
      return res.render('register', {
        title: 'Register',
        error: "Username is already taken",
        user: req.session.user,
        csrfToken: req.csrfToken()
      });
    }

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
    csrfToken: req.csrfToken(),
    error: null
  });
};

/**
 * POST /users/login
 * Process login form
 */
exports.postLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    let loginError = null;

    //Redirects to home after logging in, sets account variables
    if (username && password) {
      const { data: profile, error: queryError } = await supabase
        .from('users')
        .select('id, password_hash')
        .eq('username', username)
        .single();
      
      if(profile) {
        let equalPW = await bcrypt.compare(password, profile.password_hash);
        if(!equalPW) {
          loginError = "Incorrect Password";
        }
      }
      else {
        loginError = "Username not Found";
      }
    }
    else {
      loginError = "Invalid username or password";
    }

    // Some error occured when logging in, resend the page with an error message
    if(loginError) {
      res.render('login', {
        user: null,
        title: 'Login',
        csrfToken: req.csrfToken(),
        error: loginError
      });
    } 
    else {
      req.session.user = { username };
      req.session.user.creation = Date.now();
      req.session.user.gamesPlayed = 0;
      req.session.user.right = 0;
      req.session.user.wrong = 0;
      return res.redirect('/');
    }
    
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

  if (req.session.user.wrong > 0) {
    ratio = ((req.session.user.right / (req.session.user.wrong + req.session.user.right)) * 100);
    ratio = ratio.toFixed(2);
  }


  res.render('profile', {
    title: 'Profile',
    user: user.username,
    date: creationDate,
    csrfToken: req.csrfToken(),
    total: req.session.user.gamesPlayed,
    right: req.session.user.right,
    wrong: req.session.user.wrong,
    ratio: ratio || 0
  });
};

// Add more controller methods as needed
