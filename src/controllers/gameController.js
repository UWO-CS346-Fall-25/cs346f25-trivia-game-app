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
 * GET /
 * Display the home page
 */

/** Sample question data for now, using content from here:
 *  https://opentdb.com/api_config.php
 */

exports.loadGame = async (req, res) => {
  //Session variables to store current question index and number correct
  if (!req.session.gameData) {
    req.session.gameData = {
      currIndex: 0,
      correct: 0,
      answered: 0,
      incorrect: 0
    }
  }

  const slug = req.params.slug;

  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id, title')
    .eq('slug', slug)
    .single();

  if (gameError) {
    console.log(gameError);
  }

  const { data: questions, error: questionError } = await supabase
    .from('questions')
    .select('id, question, option_a, option_b, option_c, option_d, answer')
    .eq('game_id', game.id)
    .order('id', { ascending: true });


  question = questions[req.session.gameData.currIndex];

  question.choices = [
    question.option_a,
    question.option_b,
    question.option_c,
    question.option_d
  ];

  req.session.title = game.title;

  res.render('gamescreen', {
    title: game.title,
    question,
    csrfToken: req.csrfToken()
  });
};

exports.checkAnswer = async (req, res) => {
  const { selectedAnswer, question_id } = req.body;

  // Get the current question from SQL
  const { data: questionData, error: questionError } = await supabase
    .from('questions')
    .select('id, question, answer, game_id')
    .eq('id', question_id)
    .single();

  if (questionError) {
    console.error("Error fetching question:", questionError);
  }

  // Check if the selected answer matches the correct one
  const isCorrect = selectedAnswer === questionData.answer;

  req.session.gameData.answered++;

  if (isCorrect) {
    req.session.gameData.correct++;
  } else {
    req.session.gameData.incorrect++;
  }

  // Load all questions for this game to move to the next one
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id, question, option_a, option_b, option_c, option_d, answer')
    .eq('game_id', questionData.game_id)
    .order('id', { ascending: true });

  if (questionsError) {
    console.error("Error fetching questions:", questionsError);
  }

  //Update question counter
  req.session.gameData.currIndex++;

  // If no more questions are left, end the game
  if (req.session.gameData.currIndex >= questions.length) {

    // Get current stats for the user
    const { data: scoreRow, error: scoreFetchError } = await supabase
      .from("user_scores")
      .select("games_played, num_correct, num_incorrect, num_answered")
      .eq("user_id", req.session.user.id)
      .single();

    if (scoreFetchError) {
      console.error(scoreFetchError);
      return;
    }

    // Update stats for the user using the old stats and new stats
    const { data: newStats, error } = await supabase
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

    if (error) {
      console.log(error);
    }

    //Store game data to keep track of how many times a user has played it
    // Upsert -> Update if it exists, Insert if it doesn't
    const { data: stats } = await supabase
      .from("user_game_stats")
      .select("plays, correct, incorrect, answered")
      .eq("user_id", req.session.user.id)
      .eq("game_id", questionData.game_id)
      .maybeSingle();

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

    // Store important info, clear the game data
    const score = req.session.gameData.correct;
    const total = questions.length;
    delete req.session.gameData;
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

  res.render('gamescreen', {
    title: req.session.title,
    question: nextQuestion,
    csrfToken: req.csrfToken()
  });
};


