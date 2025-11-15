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
      correct: 0
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

  if (isCorrect) {
    req.session.gameData.correct++;
    if (req.session.user) req.session.user.right++;
  } else {
    if (req.session.user) req.session.user.wrong++;
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
    const score = req.session.gameData.correct;
    const total = questions.length;
    delete req.session.gameData;
    if (req.session.user) req.session.user.gamesPlayed++;
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


