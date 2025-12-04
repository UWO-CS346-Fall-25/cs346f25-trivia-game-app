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
    if (!validEmail.test(email)) {
      return res.render('register', {
        title: 'Register',
        error: 'Enter a valid email',
        user: req.session.user,
        csrfToken: req.csrfToken()
      });
    }

    //If it's valid, hash password and store data
    let hashedPassword = await bcrypt.hash(password, 10);

    const { data: user_data, error: insertionError } = await supabase
      .from("users")
      .insert([
        { username: username, email: email, password_hash: hashedPassword },
      ])
      .select("id, username, created_at");

    if (insertionError || !user_data || user_data.length === 0) {
      console.error("Insert error:", insertionError);

      return res.render("register", {
        title: "Register",
        csrfToken: req.csrfToken(),
        error: "Registration failed",
      });
    }

    req.session.user = {
      username,
      id: user_data[0].id,
      creation: user_data[0].created_at,
    };

    if (insertionError) {
      return res.render('register', {
        title: 'Register',
        error: "Username is already taken",
        user: req.session.user,
        csrfToken: req.csrfToken()
      });
    }

    const { data: score, error: score_error } = await supabase
      .from('user_scores')
      .insert({
        user_id: user_data[0].id,
        games_played: 0,
        num_correct: 0,
        num_incorrect: 0,
        num_answered: 0
      })

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
    let user_data;
    //Redirects to home after logging in, sets account variables
    if (username && password) {
      const { data: profile, error: queryError } = await supabase
        .from('users')
        .select('id, username, password_hash, created_at')
        .eq('username', username)
        .single();

      if (profile) {
        let equalPW = await bcrypt.compare(password, profile.password_hash);
        if (!equalPW) {
          loginError = "Incorrect Password";
        }
        user_data = profile;
      }
      else {
        loginError = "Username not Found";
      }
    }
    else {
      loginError = "Invalid username or password";
    }

    // Some error occured when logging in, resend the page with an error message
    if (loginError) {
      return res.render('login', {
        user: null,
        title: 'Login',
        csrfToken: req.csrfToken(),
        error: loginError
      });
    }
    else {
      req.session.user = {
        username,
        id: user_data.id,
        creation: user_data.created_at,
      };

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
    res.redirect('/login');
  });
};

exports.getProfile = async (req, res) => {
  const user = req.session.user;

  const { data: scoreRow, error: scoreFetchError } = await supabase
    .from("user_scores")
    .select("games_played, num_correct, num_incorrect, num_answered")
    .eq("user_id", user.id)
    .single();

  if (scoreFetchError) {
    console.error(scoreFetchError);
    return;
  }

  // Calculate and display game stats
  let ratio = 0;

  if (scoreRow.num_incorrect > 0) {
    ratio = ((scoreRow.num_correct / (scoreRow.num_answered)) * 100);
    ratio = ratio.toFixed(2);
  }

  const date = new Date(user.creation).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  //Get the top 3 most played games
  const { data: topGames } = await supabase
    .from("user_game_stats")
    .select("plays, game_id, games (title, slug)")
    .eq("user_id", user.id)
    .order("plays", { ascending: false })
    .limit(3);


  //Get the title of the most played game
  let favoriteGame = "None";

  if (topGames && topGames.length > 0) {
    favoriteGame = topGames[0].games.title;
  }


  res.render('profile', {
    title: 'Profile',
    user: user.username,
    date,
    favoriteGame,
    topGames,
    csrfToken: req.csrfToken(),
    total: scoreRow.games_played,
    right: scoreRow.num_correct,
    wrong: scoreRow.num_incorrect,
    ratio: ratio || 0
  });
};

// Add more controller methods as needed
