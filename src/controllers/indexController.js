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
const userController = require("./userController");


/**
 * Controller: getHome
 * Purpose: Load the home page, ensure default games exist, fetch leaderboard and game list
 * Input: req.session.user, req.csrfToken()
 * Output: Renders /index
 */
exports.getHome = async (req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [IndexController] START getHome`);

  try {
    console.log(`[${ts}] [IndexController] Checking game count in database...`);

    // Get game count
    let count = 0;
    try {
      const result = await supabase
        .from("games")
        .select("id", { head: true, count: "exact" });

      count = result.count;
    } catch (err) {
      console.error(`[${ts}] [IndexController] DB EXCEPTION checking game count: ${err.message}`);
      return res.render("error", { title: "Error" });
    }

    console.log(`[${ts}] [IndexController] Game count retrieved: ${count}`);

    // If there are less than 8 questions, create default questions
    if (count === 0) {
      console.log(`[${ts}] [IndexController] No games found. Fetching default questions from API...`);

      // API Call for 48 completely random questions
      let apiData = null;
      try {
        const response = await fetch("https://opentdb.com/api.php?amount=48&type=multiple");
        apiData = await response.json();
      } catch (err) {
        console.error(`[${ts}] [IndexController] API EXCEPTION fetching default questions: ${err.message}`);
        return res.render("error", { title: "Error" });
      }

      console.log(`[${ts}] [IndexController] API call completed. Beginning default game creation.`);

      const questions = apiData ? apiData.results : [];

      // Create 8 default games with 6 questions each
      for (let i = 0; i < 8; i++) {
        console.log(`[${ts}] [IndexController] Creating default game ${i + 1}...`);

        const title = "Game " + (i + 1);
        const slug = "game-" + (i + 1);
        const description = "Default Game";

        // Insert default game
        let insertedGame, sqlError;
        try {
          const result = await supabase
            .from("games")
            .insert([{ title: title, description: description, slug: slug, user_id: null }])
            .select();

          insertedGame = result.data;
          sqlError = result.error;
        } catch (err) {
          console.error(`[${ts}] [IndexController] DB EXCEPTION inserting default game: ${err.message}`);
          return res.render("error", { title: "Error" });
        }

        if (sqlError || !insertedGame) {
          console.error(`[${ts}] [IndexController] ERROR inserting default game: ${sqlError?.message}`);
          return res.render("error", { title: "Error" });
        }

        const id = insertedGame[0].id;

        console.log(`[${ts}] [IndexController] Default game created with ID: ${id}. Inserting questions...`);

        // Create each question by combining question titles and answers
        for (let j = 0; j < 6; j++) {
          const currQuestion = questions.shift();

          let answers = currQuestion.incorrect_answers.concat(currQuestion.correct_answer);
          shuffle(answers);

          for (let k = 0; k < answers.length; k++) {
            answers[k] = decodeHtml(answers[k]);
          }

          const questionText = decodeHtml(currQuestion.question);
          const correct = decodeHtml(currQuestion.correct_answer);

          const index = answers.indexOf(correct);
          const letters = ['A', 'B', 'C', 'D'];
          let correctLetter = letters[index];

          // Insert question
          let qError;
          try {
            const result = await supabase
              .from("questions")
              .insert([{
                game_id: id,
                question: questionText,
                option_a: answers[0],
                option_b: answers[1],
                option_c: answers[2],
                option_d: answers[3],
                answer: correctLetter
              }])
              .select();

            qError = result.error;
          } catch (err) {
            console.error(`[${ts}] [IndexController] DB EXCEPTION inserting question: ${err.message}`);
            return res.render("error", { title: "Error" });
          }

          if (qError) {
            console.error(`[${ts}] [IndexController] ERROR inserting question: ${qError.message}`);
            return res.render("error", { title: "Error" });
          }
        }
      }

      console.log(`[${ts}] [IndexController] Default games and questions successfully created.`);
    }

    console.log(`[${ts}] [IndexController] Fetching all games from DB...`);

    // Fetch all games
    let gamesData, gamesError;
    try {
      const result = await supabase
        .from('games')
        .select('id, title, description, slug, user_id');

      gamesData = result.data;
      gamesError = result.error;
    } catch (err) {
      console.error(`[${ts}] [IndexController] DB EXCEPTION fetching all games: ${err.message}`);
      return res.render("error", { title: "Error" });
    }

    if (gamesError) {
      console.error(`[${ts}] [IndexController] ERROR fetching games: ${gamesError.message}`);
      return res.render("error", { title: "Error" });
    }

    console.log(`[${ts}] [IndexController] Fetching leaderboard data...`);

    // Fetch leaderboard
    let leaders, leaderError;
    try {
      const result = await supabase
        .from("user_scores")
        .select("user_id, num_correct, users (username)")
        .order("num_correct", { ascending: false })
        .limit(5);

      leaders = result.data;
      leaderError = result.error;
    } catch (err) {
      console.error(`[${ts}] [IndexController] DB EXCEPTION fetching leaderboard: ${err.message}`);
      return res.render("error", { title: "Error" });
    }

    if (leaderError) {
      console.error(`[${ts}] [IndexController] ERROR fetching leaders: ${leaderError.message}`);
      return res.render("error", { title: "Error" });
    }

    console.log(`[${ts}] [IndexController] Rendering home page...`);

    res.render('index', {
      title: 'Trivia Home',
      data: gamesData,
      leaders,
      user: req.session.user || null,
      csrfToken: req.csrfToken()
    });

    console.log(`[${ts}] [IndexController] END getHome`);
  } catch (error) {
    console.error(`[${ts}] [IndexController] UNEXPECTED ERROR in getHome: ${error.message}`);
    return res.render("error", { title: "Error" });
  }
};


/**
 * Helper method to shuffle the answers in an array
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Helper to decode HTML entities
 */
function decodeHtml(str) {
  return str
    .replaceAll('&quot;', '"')
    .replaceAll('&eacute;', 'é')
    .replaceAll('&#039;', "'")
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&ldquo;', '“')
    .replaceAll('&rdquo;', '”')
    .replaceAll('&auml;', 'ä')
    .replaceAll('&ouml;', 'ö')
    .replaceAll('&aring;', 'å')
    .replaceAll('&rsquo;', '’')
    .replaceAll('&uuml;', 'ü');
}


/**
 * Controller: deleteAccount
 * Purpose: Delete all user-related data (games, scores, user record) then log user out
 * Input: req.session.user.id
 * Output: Redirects to /login via postLogout()
 */
exports.deleteAccount = async (req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [IndexController] START deleteAccount`);

  try {
    const userId = req.session.user.id;
    console.log(`[${ts}] [IndexController] Deleting account for user ID: ${userId}`);

    // Attempt to delete games created by current user
    try {
      await supabase.from("games").delete().eq("user_id", userId);
    } catch (err) {
      console.error(`[${ts}] [IndexController] DB EXCEPTION deleting user games: ${err.message}`);
      return res.render("error", { title: "Error" });
    }

    // Attempt to delete user scores
    try {
      await supabase.from("user_scores").delete().eq("user_id", userId);
    } catch (err) {
      console.error(`[${ts}] [IndexController] DB EXCEPTION deleting user scores: ${err.message}`);
      return res.render("error", { title: "Error" });
    }

    // Attempt to delete user
    try {
      await supabase.from("users").delete().eq("id", userId);
    } catch (err) {
      console.error(`[${ts}] [IndexController] DB EXCEPTION deleting user record: ${err.message}`);
      return res.render("error", { title: "Error" });
    }

    console.log(`[${ts}] [IndexController] User deletion complete. Logging out...`);
    console.log(`[${ts}] [IndexController] END deleteAccount`);
    return userController.postLogout(req, res);

  } catch (error) {
    console.error(`[${ts}] [IndexController] ERROR in deleteAccount: ${error.message}`);
    return res.render("error", { title: "Error" });
  }
};


/**
 * Controller: deleteGame
 * Purpose: Delete a single game by ID
 * Input: req.params.id
 * Output: Redirects to /index
 */
exports.deleteGame = async (req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [IndexController] START deleteGame`);

  // Attempt to delete the game
  try {
    const gameId = req.params.id;
    console.log(`[${ts}] [IndexController] Deleting game with ID: ${gameId}`);

    try {
      await supabase.from("games").delete().eq("id", gameId);
    } catch (err) {
      console.error(`[${ts}] [IndexController] DB EXCEPTION deleting game: ${err.message}`);
      return res.render("error", { title: "Error" });
    }

    console.log(`[${ts}] [IndexController] Game deleted. Redirecting home.`);
    console.log(`[${ts}] [IndexController] END deleteGame`);
    return res.redirect("/");

  } catch (error) {
    console.error(`[${ts}] [IndexController] ERROR in deleteGame: ${error.message}`);
    return res.render("error", { title: "Error" });
  }
};

// Add more controller methods as needed
