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
    // If there's nothing in the databse, populate it with default questions using the API
    const { count } = await supabase
      .from("games")
      .select("id",
        { head: true, count: "exact" }
      );

    if (count === 0) {
      const response = await fetch("https://opentdb.com/api.php?amount=48&type=multiple");

      const data = await response.json();
      const questions = data.results;

      // Create generic games from the API data
      for (let i = 0; i < 8; i++) {
        const title = "Game " + (i + 1);
        const slug = "game-" + (i + 1);
        const description = "Default Game";

        const { data, error: sqlError } = await supabase
          .from("games")
          .insert([
            { title: title, description: description, slug: slug, user_id: null },
          ])
          .select();

        const id = data[0].id;

        for (let j = 0; j < 6; j++) {
          const currQuestion = questions.shift();

          //Shuffle the answers so that the the right one isn't always the last one
          let answers = currQuestion.incorrect_answers.concat(currQuestion.correct_answer);
          shuffle(answers);

          //Decode the question text to format it correctly
          for (let k = 0; k < answers.length; k++) {
            answers[k] = decodeHtml(answers[k]);
          }

          //Decode/format the provided answers/question
          const questionText = decodeHtml(currQuestion.question);
          const correct = decodeHtml(currQuestion.correct_answer);

          //Find which letter the answer is at
          const index = answers.indexOf(correct);
          const letters = ['A', 'B', 'C', 'D'];
          let correctLetter = letters[index];

          const { data, error } = await supabase
            .from("questions")
            .insert([{
              game_id: id, question: questionText,
              option_a: answers[0], option_b: answers[1],
              option_c: answers[2], option_d: answers[3], answer: correctLetter
            },])
            .select();
        }

        if (sqlError) {
          console.log("database error");
        }
      }
    }

    //Get all the games in the database
    const { data, error } = await supabase
      .from('games')
      .select('id, title, description, slug, user_id')

    if (error) {
      console.error('Error fetching games:', error);
    }

    // Get leaderboard data
    const { data: leaders, error: leaderError } = await supabase
      .from("user_scores")
      .select("user_id, num_correct, users (username)")
      .order("num_correct", { ascending: false })
      .limit(5);

    if (leaderError) {
      console.error('Error fetching leaders:', error);
    }

    res.render('index', {
      title: 'Trivia Home',
      data,
      leaders,
      user: req.session.user || null,
      csrfToken: req.csrfToken()
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Helper method to shuffle the answers in an array
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

//Helper to fix the returned JSON strings
//Added some of the codes that appeared in strings
function decodeHtml(str) {
  return str
    .replaceAll('&quot;', '"')
    .replaceAll('&eacute;', 'é')
    .replaceAll('&#039;', "'")
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}


/**
 * POST /
 * Delete a game
 */
exports.deleteGame = async (req, res, next) => {

  try {
    const gameId = req.params.id;
    await supabase
      .from("games")
      .delete()
      .eq("id", gameId);

    //Get home
    return res.redirect("/");
  }
  catch (error) {
    next(error);
  }
};


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
