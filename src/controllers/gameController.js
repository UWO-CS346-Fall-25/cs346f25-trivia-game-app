/**
 * Game Controller
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
 * Controller: loadGame
 * Purpose: Initialize a game session, load the first question, and render the game screen
 * Input: req.params.slug (string) – identifies which game to load
 * Output: Renders /gamescreen with the current question
 */
exports.loadGame = async (req, res) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [GameController] START loadGame`);

  try {

    //Session variables to store current question index and number correct
    if (!req.session.gameData) {
      console.log(`[${ts}] [GameController] Initializing session gameData object.`);
      req.session.gameData = {
        currIndex: 0,
        correct: 0,
        answered: 0,
        incorrect: 0
      }
    }

    const slug = req.params.slug;
    console.log(`[${ts}] [GameController] Loading game with slug: ${slug}`);

    // Fetch the game
    let game;
    try {
      console.log(`[${ts}] [GameController] Fetching game metadata from DB...`);
      const result = await supabase
        .from('games')
        .select('id, title')
        .eq('slug', slug)
        .single();

      if (result.error) throw result.error;
      game = result.data;

    } catch (err) {
      console.error(`[${ts}] [GameController] ERROR fetching game: ${err.message}`);
      return res.render("error", { title: "Error" });
    }

    // Fetch questions for the game
    let questions;
    try {
      console.log(`[${ts}] [GameController] Fetching questions for game ID: ${game.id}`);
      const result = await supabase
        .from('questions')
        .select('id, question, option_a, option_b, option_c, option_d, answer')
        .eq('game_id', game.id)
        .order('id', { ascending: true });

      if (result.error) throw result.error;
      questions = result.data;

    } catch (err) {
      console.error(`[${ts}] [GameController] ERROR fetching questions: ${err.message}`);
      return res.render("error", { title: "Error" });
    }

    //Store questions and options in a session variable
    question = questions[req.session.gameData.currIndex];

    question.choices = [
      question.option_a,
      question.option_b,
      question.option_c,
      question.option_d
    ];

    req.session.title = game.title;

    console.log(`[${ts}] [GameController] Rendering gamescreen for question index ${req.session.gameData.currIndex}`);
    console.log(`[${ts}] [GameController] END loadGame`);

    return res.render('gamescreen', {
      title: game.title,
      question,
      csrfToken: req.csrfToken()
    });

  } catch (err) {
    console.error(`[${ts}] [GameController] UNEXPECTED ERROR in loadGame: ${err.message}`);
    return res.render("error", { title: "Error" });
  }
};



/**
 * Controller: checkAnswer
 * Purpose: Validate the user's answer, update session stats, advance game state,
 *          update user score records, and end the game if it was the last question
 * Input: req.body.selectedAnswer (string), req.body.question_id (number)
 * Output: Renders next question OR renders /gameover if finished
 */
exports.checkAnswer = async (req, res) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [GameController] START checkAnswer`);

  try {
    const { selectedAnswer, question_id } = req.body;
    console.log(`[${ts}] [GameController] Checking answer for question ID: ${question_id}`);


    // Get the current question from SQL
    let questionData;
    try {
      console.log(`[${ts}] [GameController] Fetching question from DB...`);
      const result = await supabase
        .from('questions')
        .select('id, question, answer, game_id')
        .eq('id', question_id)
        .single();

      if (result.error) throw result.error;
      questionData = result.data;

    } catch (err) {
      console.error(`[${ts}] [GameController] ERROR fetching question: ${err.message}`);
      return res.render("error", { title: "Error" });
    }


    // Check if the selected answer matches the correct one
    const isCorrect = selectedAnswer === questionData.answer;
    console.log(`[${ts}] [GameController] Selected answer: ${selectedAnswer} | Correct: ${questionData.answer} | Match: ${isCorrect}`);

    req.session.gameData.answered++;

    if (isCorrect) {
      req.session.gameData.correct++;
    } else {
      req.session.gameData.incorrect++;
    }

    console.log(`[${ts}] [GameController] Updated session stats: correct=${req.session.gameData.correct}, incorrect=${req.session.gameData.incorrect}, answered=${req.session.gameData.answered}`);


    // Load all questions for this game to move to the next one
    let questions;
    try {
      console.log(`[${ts}] [GameController] Fetching all questions for progression...`);
      const result = await supabase
        .from('questions')
        .select('id, question, option_a, option_b, option_c, option_d, answer')
        .eq('game_id', questionData.game_id)
        .order('id', { ascending: true });

      if (result.error) throw result.error;
      questions = result.data;

    } catch (err) {
      console.error(`[${ts}] [GameController] ERROR fetching all questions: ${err.message}`);
      return res.render("error", { title: "Error" });
    }


    // Update question counter
    req.session.gameData.currIndex++;
    console.log(`[${ts}] [GameController] Incremented question index to ${req.session.gameData.currIndex}`);


    // If no more questions are left, end the game
    if (req.session.gameData.currIndex >= questions.length) {

      // Get current stats for the user
      let scoreRow;
      try {
        console.log(`[${ts}] [GameController] Fetching current user stats...`);
        const result = await supabase
          .from("user_scores")
          .select("games_played, num_correct, num_incorrect, num_answered")
          .eq("user_id", req.session.user.id)
          .single();

        if (result.error) throw result.error;
        scoreRow = result.data;

      } catch (err) {
        console.error(`[${ts}] [GameController] ERROR fetching user stats: ${err.message}`);
        return res.render("error", { title: "Error" });
      }


      // Update stats for the user
      try {
        console.log(`[${ts}] [GameController] Updating user stats...`);
        await supabase
          .from("user_scores")
          .update({
            games_played: scoreRow.games_played + 1,
            num_correct: scoreRow.num_correct + req.session.gameData.correct,
            num_incorrect: scoreRow.num_incorrect + req.session.gameData.incorrect,
            num_answered: scoreRow.num_answered + req.session.gameData.answered
          })
          .eq("user_id", req.session.user.id)
          .select()
          .single();

      } catch (err) {
        console.error(`[${ts}] [GameController] ERROR updating scoreRow: ${err.message}`);
        return res.render("error", { title: "Error" });
      }


      // Per-game stats (user_game_stats)
      let stats;
      try {
        const result = await supabase
          .from("user_game_stats")
          .select("plays, correct, incorrect, answered")
          .eq("user_id", req.session.user.id)
          .eq("game_id", questionData.game_id)
          .maybeSingle();

        if (result.error) throw result.error;
        stats = result.data;

      } catch (err) {
        console.error(`[${ts}] [GameController] ERROR fetching per-game stats: ${err.message}`);
        return res.render("error", { title: "Error" });
      }


      //Update game stats
      try {
        await supabase
          .from("user_game_stats")
          .upsert({
            user_id: req.session.user.id,
            game_id: questionData.game_id,
            plays: (stats ? stats.plays : 0) + 1,
            correct: (stats ? stats.correct : 0) + req.session.gameData.correct,
            incorrect: (stats ? stats.incorrect : 0) + req.session.gameData.incorrect,
            answered: (stats ? stats.answered : 0) + req.session.gameData.answered,
          });

      } catch (err) {
        console.error(`[${ts}] [GameController] ERROR upserting per-game stats: ${err.message}`);
        return res.render("error", { title: "Error" });
      }


      // Store important info, clear the game data
      const score = req.session.gameData.correct;
      const total = questions.length;
      delete req.session.gameData;

      console.log(`[${ts}] [GameController] END checkAnswer`);
      return res.render('gameover', { title: "Game Over", score, total });
    }


    // Otherwise, show the next question
    const nextQuestion = questions[req.session.gameData.currIndex];

    nextQuestion.choices = [
      nextQuestion.option_a,
      nextQuestion.option_b,
      nextQuestion.option_c,
      nextQuestion.option_d
    ];

    console.log(`[${ts}] [GameController] END checkAnswer`);

    return res.render('gamescreen', {
      title: req.session.title,
      question: nextQuestion,
      csrfToken: req.csrfToken()
    });

  } catch (err) {
    console.error(`[${ts}] [GameController] UNEXPECTED ERROR in checkAnswer: ${err.message}`);
    return res.render("error", { title: "Error" });
  }
};
