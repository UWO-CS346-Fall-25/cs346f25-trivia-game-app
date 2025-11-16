/**
 * Index Controller
 *
 * Controllers handle the business logic for routes.
 * They process requests, interact with models, and send responses.
 *
 * Best practices:
 * - Keep controllers focused on request/response handling
 * - Move complex business logic to separate service files
 * - Use models to interact with the database
 * - Handle errors appropriately
 */

// Import models if needed
// const SomeModel = require('../models/SomeModel');
const supabase = require('../supabase');



/**
 * GET /
 * Display the home page
 */
exports.getHome = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('id, title, description, slug')

    if (error) {
      console.error('Error fetching games:', error);
    }

    res.render('index', {
      title: 'Trivia Home',
      data,
      user: req.session.user || null,
      csrfToken: req.csrfToken()
    });

  } catch (error) {
    next(error);
  }
}

/**
 * GET /about
 * Display the about page
 */
exports.getAbout = async (req, res, next) => {
  try {
    res.render('about', {
      title: 'About',
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    next(error);
  }
};

// Add more controller methods as needed
