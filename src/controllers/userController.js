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
 * Controller: getRegister
 * Purpose: Render the registration page
 * Input: req.session.user (session info)
 * Output: Renders /views/register.ejs
 */
exports.getRegister = (req, res) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [UserController] START getRegister`);

  try {
    res.render('register', {
      user: req.session.user,
      title: 'Register',
      error: null,
      csrfToken: req.csrfToken()
    });

    console.log(`[${ts}] [UserController] END getRegister`);
  } catch (err) {
    console.error(`[${ts}] [UserController] ERROR in getRegister: ${err.message}`);
    return res.render("error", { title: "Error" });
  }
};



/**
 * Controller: postRegister
 * Purpose: Validate input, create a new user, initialize score row, create session
 * Input: req.body.username, req.body.email, req.body.password
 * Output: Redirects to home OR re-renders register.ejs with an error
 */
exports.postRegister = async (req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [UserController] START postRegister`);

  try {
    const { username, email, password } = req.body;
    console.log(`[${ts}] [UserController] Registration attempt for username="${username}" email="${email}"`);

    // Basic password checking
    if (password.length < 6) {
      console.log(`[${ts}] [UserController] Password too short.`);
      return res.render('register', {
        title: 'Register',
        error: 'Password must be at least 6 characters long.',
        user: req.session.user,
        csrfToken: req.csrfToken()
      });
    }

    // Validate email
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!validEmail.test(email)) {
      console.log(`[${ts}] [UserController] Invalid email format.`);
      return res.render('register', {
        title: 'Register',
        error: 'Enter a valid email',
        user: req.session.user,
        csrfToken: req.csrfToken()
      });
    }

    console.log(`[${ts}] [UserController] Hashing password...`);
    let hashedPassword = await bcrypt.hash(password, 10);

    console.log(`[${ts}] [UserController] Inserting new user into database...`);

    // Insert new user
    let user_data, insertionError;
    try {
      const result = await supabase
        .from("users")
        .insert([{ username: username, email: email, password_hash: hashedPassword }])
        .select("id, username, created_at");

      user_data = result.data;
      insertionError = result.error;
    } catch (err) {
      console.error(`[${ts}] [UserController] DB EXCEPTION inserting user: ${err.message}`);
      return res.render("error", { title: "Error" });
    }

    // Some error occurred when attempting to insert
    if (insertionError || !user_data || user_data.length === 0) {
      console.error(`[${ts}] [UserController] Insert error: ${insertionError?.message}`);
      let errorMsg = insertionError ? "Username Taken" : "Registration error";

      console.log(`[${ts}] [UserController] Registration failed: ${errorMsg}`);
      return res.render("register", {
        title: "Register",
        csrfToken: req.csrfToken(),
        error: errorMsg,
      });
    }

    console.log(`[${ts}] [UserController] Registration successful. Creating session...`);
    req.session.user = {
      username,
      id: user_data[0].id,
      creation: user_data[0].created_at,
    };

    console.log(`[${ts}] [UserController] Creating initial user score row...`);

    // Create initial user_scores row
    let score_error;
    try {
      const result = await supabase
        .from('user_scores')
        .insert({
          user_id: user_data[0].id,
          games_played: 0,
          num_correct: 0,
          num_incorrect: 0,
          num_answered: 0
        });

      score_error = result.error;
    } catch (err) {
      console.error(`[${ts}] [UserController] DB EXCEPTION creating score row: ${err.message}`);
      return res.render("error", { title: "Error" });
    }

    if (score_error) {
      console.error(`[${ts}] [UserController] ERROR creating score row: ${score_error.message}`);
    }

    console.log(`[${ts}] [UserController] END postRegister`);
    return res.redirect('/');

  } catch (error) {
    console.error(`[${ts}] [UserController] UNEXPECTED ERROR in postRegister: ${error.message}`);
    return res.render("error", { title: "Error" });
  }
};



/**
 * Controller: getLogin
 * Purpose: Render the login page
 * Input: req.session.user (session info)
 * Output: Renders /views/login.ejs
 */
exports.getLogin = (req, res) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [UserController] START getLogin`);

  try {
    res.render('login', {
      user: req.session.user,
      title: 'Login',
      csrfToken: req.csrfToken(),
      error: null
    });

    console.log(`[${ts}] [UserController] END getLogin`);
  } catch (err) {
    console.error(`[${ts}] [UserController] ERROR in getLogin: ${err.message}`);
    return res.render("error", { title: "Error" });
  }
};



/**
 * Controller: postLogin
 * Purpose: Validate credentials, authenticate user, create session
 * Input: req.body.username, req.body.password
 * Output: Redirects to home OR re-renders login.ejs with an error
 */
exports.postLogin = async (req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [UserController] START postLogin`);

  try {
    const { username, password } = req.body;
    let loginError = null;
    let user_data;

    console.log(`[${ts}] [UserController] Login attempt for "${username}"`);

    if (username && password) {
      console.log(`[${ts}] [UserController] Fetching user from DB...`);

      // Fetch user by username
      let profile, queryError;
      try {
        const result = await supabase
          .from('users')
          .select('id, username, password_hash, created_at')
          .eq('username', username)
          .single();

        profile = result.data;
        queryError = result.error;
      } catch (err) {
        console.error(`[${ts}] [UserController] DB EXCEPTION fetching user: ${err.message}`);
        return res.render("error", { title: "Error" });
      }

      //Determines whether the user exists in the DB and validates info
      if (profile) {
        console.log(`[${ts}] [UserController] User found. Validating password...`);
        let equalPW = await bcrypt.compare(password, profile.password_hash);
        if (!equalPW) {
          console.log(`[${ts}] [UserController] Incorrect password.`);
          loginError = "Incorrect Password";
        }
        user_data = profile;
      }
      else {
        console.log(`[${ts}] [UserController] Username not found.`);
        loginError = "Username not Found";
      }
    }
    else {
      console.log(`[${ts}] [UserController] Missing username or password.`);
      loginError = "Invalid username or password";
    }

    if (loginError) {
      console.log(`[${ts}] [UserController] Login failed. Rendering login page with error.`);
      return res.render('login', {
        user: null,
        title: 'Login',
        csrfToken: req.csrfToken(),
        error: loginError
      });
    }
    else {
      console.log(`[${ts}] [UserController] Login successful. Creating session...`);
      req.session.user = {
        username,
        id: user_data.id,
        creation: user_data.created_at,
      };

      console.log(`[${ts}] [UserController] END postLogin`);
      return res.redirect('/');
    }

  } catch (error) {
    console.error(`[${ts}] [UserController] UNEXPECTED ERROR in postLogin: ${error.message}`);
    return res.render("error", { title: "Error" });
  }
};



/**
 * Controller: postLogout
 * Purpose: Logs the current user out and destroys session
 * Input: req.session (session object)
 * Output: Redirects to /login
 */
exports.postLogout = (req, res) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [UserController] START postLogout`);

  try {
    req.session.destroy((err) => {
      if (err) {
        console.error(`[${ts}] [UserController] ERROR destroying session: ${err.message}`);
        return res.render("error", { title: "Error" });
      }
      console.log(`[${ts}] [UserController] END postLogout`);
      res.redirect('/login');
    });
  } catch (err) {
    console.error(`[${ts}] [UserController] UNEXPECTED ERROR in postLogout: ${err.message}`);
    return res.render("error", { title: "Error" });
  }
};



/**
 * Controller: getProfile
 * Purpose: Load the user's stats, game history, and profile details
 * Input: req.session.user.id (user ID)
 * Output: Renders /views/profile.ejs
 */
exports.getProfile = async (req, res) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [UserController] START getProfile`);

  try {
    const user = req.session.user;

    console.log(`[${ts}] [UserController] Fetching user stats for ID: ${user.id}`);

    // Fetch scoreRow
    let scoreRow, scoreFetchError;
    try {
      const result = await supabase
        .from("user_scores")
        .select("games_played, num_correct, num_incorrect, num_answered")
        .eq("user_id", user.id)
        .single();

      scoreRow = result.data;
      scoreFetchError = result.error;
    } catch (err) {
      console.error(`[${ts}] [UserController] DB EXCEPTION fetching scoreRow: ${err.message}`);
      return res.render("error", { title: "Error" });
    }

    if (scoreFetchError) {
      console.error(`[${ts}] [UserController] ERROR fetching scoreRow: ${scoreFetchError.message}`);
      return res.render("error", { title: "Error" });
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

    console.log(`[${ts}] [UserController] Fetching top played games...`);

    // Fetch topGames
    let topGames;
    try {
      const result = await supabase
        .from("user_game_stats")
        .select("plays, game_id, games (title, slug)")
        .eq("user_id", user.id)
        .order("plays", { ascending: false })
        .limit(3);

      topGames = result.data;
    } catch (err) {
      console.error(`[${ts}] [UserController] DB EXCEPTION fetching topGames: ${err.message}`);
      return res.render("error", { title: "Error" });
    }

    let favoriteGame = "None";

    if (topGames && topGames.length > 0) {
      favoriteGame = topGames[0].games.title;
    }

    console.log(`[${ts}] [UserController] Rendering profile page.`);
    console.log(`[${ts}] [UserController] END getProfile`);

    return res.render('profile', {
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

  } catch (err) {
    console.error(`[${ts}] [UserController] UNEXPECTED ERROR in getProfile: ${err.message}`);
    return res.render("error", { title: "Error" });
  }
};
