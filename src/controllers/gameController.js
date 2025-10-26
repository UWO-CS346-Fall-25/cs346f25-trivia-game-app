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

/**
 * GET /
 * Display the home page
 */

/** Sample question data for now, using content from here:
 *  https://opentdb.com/api_config.php
 */
trivia = {
  movies : [ 
    {
      question: "Which of the following movies was not based on a novel by Stephen King?",
      choices: ["Carrie", "The Thing", "Misery", "The Green Mile"],
      answer: "The Thing",
    },
    {
      question: "Who is the main protagonist in, the 1985 film, Back to the Future?",
      choices: ["Emmet 'Doc' Brown", "Biff Tannen", "George McFly", "Marty McFly"],
      answer: "Marty McFly"
    },
    {
      question: "Who directed the 1973 film 'American Graffiti'?",
      choices: ["Ron Howard", "George Lucas", "Francis Ford Coppola", "Steven Spielberg"],
      answer: "George Lucas"
    },
    {
      question: "Which movie contains the quote, 'Say hello to my little friend!'?",
      choices: ["Scarface", "Reservoir Dogs", "Heat", "Goodfellas"],
      answer: ""
    },
    {
      question: "What was Bruce Campbell's iconic one-liner after getting a chainsaw hand in Evil Dead 2?",
      choices: ["Perfect", "Groovy", "Nice", "Gnarly"],
      answer: "Groovy"
    },
  ],
  history: [
    {
      question: "America's Strategic Defense System during the Cold War was nicknamed after this famous movie.",
      choices: ["Jaws", "Blade Runner", "Alien", "Star Wars"],
      answer: "Star Wars",
    },
    {
      question: "What micro-state is considered to have the oldest constitution still in effect?",
      choices: ["Andorra", "Monaco", "Saint Kitts and Nevis", "San Marino"],
      answer: "San Marino",
    },
    {
      question: "Which building was set aflame on August 24th, 1812?",
      choices: ["Parliament Building", "Grand National Assembly Building", "Palace of the Nation", "The White House"],
      answer: "The White House",
    },
    {
      question: "What is the bloodiest event in United States history, in terms of casualties?",
      choices: ["Pearl Harbor", "September 11th", "D-Day", "Battle of Antietam"],
      answer: "Battle of Antietam",
    },
    {
      question: "In World War I, what was the name of the alliance of Germany, Austria-Hungary, the Ottoman Empire, and Bulgaria?",
      choices: ["The Axis Powers", "The Federation of Empires", "Authoritarian Alliance", "The Central Powers"],
      answer: "The Central Powers",
    },
  ],
  politics: [
    {
      question: "The 2014 movie 'The Raid 2: Berandal' was mainly filmed in which Asian country?",
      choices: ["Thailand", "Brunei", "Malaysia", "Indonesia"],
      answer: "Indonesia",
    },
    {
      question: "What year did the effort to deploy the Common Core State Standards (CCSS) in the US begin?",
      choices: ["2012", "2006", "1997", "2009"],
      answer: "2009",
    },
    {
      question: "Which former US president used 'Let's Make America Great Again' as his campaign slogan before Donald Trump's campaign?",
      choices: ["Jimmy Carter", "Gerald Ford", "Richard Nixon", "Ronald Reagan"],
      answer: "Ronald Reagan",
    },
    {
      question: "The largest consumer market in 2015 was...",
      choices: ["Germany", "Japan", "United Kingdom", "The United States of America"],
      answer: "The United States of America",
    },
  ],
  art: [
    {
      question: "Who painted The Starry Night?",
      choices: ["Pablo Picasso", "Leonardo da Vinci", "Michelangelo", "Vincent van Gogh"],
      answer: "Vincent van Gogh",
    },
    {
      question: "What was the first successful and commercially viable photographic technique?",
      choices: ["Collodion process", "The Turin Shroud", "Kodachrome film", "The Daguerreotype"],
      answer: "The Daguerreotype",
    },
    {
      question: "Who sculpted the statue of David?",
      choices: ["Gian Lorenzo Bernini", "Auguste Rodin", "Donatello", "Michelangelo"],
      answer: "Michelangelo",
    },
    {
      question: "Which artist's style was to use small different colored dots to create a picture?",
      choices: ["Paul Cézanne", "Vincent Van Gogh", "Henri Rousseau", "Georges Seurat"],
      answer: "Georges Seurat",
    },
    {
      question: "What nationality was the surrealist painter Salvador Dali?",
      choices: ["Italian", "French", "Portuguese", "Spanish"],
      answer: "Spanish",
    },
  ],
  mythology: [
    {
      question: "What is the name of the Greek god of blacksmiths?",
      choices: ["Dyntos", "Vulcan", "Artagatus", "Hephaestus"],
      answer: "Hephaestus",
    },
    {
      question: "The ancient Roman god of war was commonly known as which of the following?",
      choices: ["Jupiter", "Juno", "Ares", "Mars"],
      answer: "Mars",
    },
    {
      question: "The Hippogriff, not to be confused with the Griffon, is a magical creature with the front half of an eagle, and the back half of what?",
      choices: ["A Dragon", "A Tiger", "A Lion", "A Horse"],
      answer: "A Horse",
    },
    {
      question: "What mythological creatures have women's faces and vultures' bodies?",
      choices: ["Mermaids", "Nymph", "Lilith", "Harpies"],
      answer: "Harpies",
    },
    {
      question: "In Norse Mythology, Baldr was killed by Loki with a magical spear made from what plant?",
      choices: ["Wolf's Bane", "Buckthorn", "Hemlock", "Mistletoe"],
      answer: "Mistletoe",
    },
  ],
  animals: [
    {
      question: "Unlike on most salamanders, this part of a newt is flat?",
      choices: ["Head", "Teeth", "Feet", "Tail"],
      answer: "Tail",
    },
    {
      question: "What are the scales on all snakes and most lizards made of?",
      choices: ["Ecdysis", "Epidermis", "Ankyloglossia", "Keratin"],
      answer: "Keratin",
    },
    {
      question: "What is the scientific name of the Budgerigar?",
      choices: ["Nymphicus hollandicus", "Pyrrhura molinae", "Ara macao", "Melopsittacus undulatus"],
      answer: "Melopsittacus undulatus",
    },
    {
      question: "What is the collective noun for rats?",
      choices: ["Pack", "Race", "Drift", "Mischief"],
      answer: "Mischief",
    },
    {
      question: "What is the scientific name for modern day humans?",
      choices: ["Homo Ergaster", "Homo Erectus", "Homo Neanderthalensis", "Homo Sapiens"],
      answer: "Homo Sapiens",
    },
  ],
  sports: [
    {
      question: "Which basketball team has attended the most NBA grand finals?",
      choices: ["Boston Celtics", "Philadelphia 76ers", "Golden State Warriors", "Los Angeles Lakers"],
      answer: "Los Angeles Lakers",
    },
    {
      question: "Who is Manchester United's leading appearance maker?",
      choices: ["David Beckham", "Wayne Rooney", "Eric Cantona", "Ryan Giggs"],
      answer: "Ryan Giggs",
    },
    {
      question: "The Los Angeles Dodgers were originally from what U.S. city?",
      choices: ["Las Vegas", "Boston", "Seattle", "Brooklyn"],
      answer: "Brooklyn",
    },
    {
      question: "What year did the New Orleans Saints win the Super Bowl?",
      choices: ["2008", "2009", "2011", "2010"],
      answer: "2010",
    },
    {
      question: "Which player holds the NHL record of 2,857 points?",
      choices: ["Mario Lemieux", "Sidney Crosby", "Gordie Howe", "Wayne Gretzky"],
      answer: "Wayne Gretzky",
    },
  ],
  geography: [
    {
      question: "Which country is the Taedong River in?",
      choices: ["South Korea", "Japan", "China", "North Korea"],
      answer: "North Korea",
    },
    {
      question: "The formerly East-Prussian city of Königsberg is known as which Russian City today?",
      choices: ["Kazan", "Kursk", "Krasnodar", "Kaliningrad"],
      answer: "Kaliningrad",
    },
    {
      question: "Which country is the home of the largest Japanese population outside of Japan?",
      choices: ["China", "Russia", "The United States", "Brazil"],
      answer: "Brazil",
    },
    {
      question: "What was the most populous city in the Americas in 2015?",
      choices: ["New York", "Mexico City", "Los Angeles", "São Paulo"],
      answer: "São Paulo",
    },
    {
      question: "Which of these Mediterranean islands is under the sovereign rule of France?",
      choices: ["Majorca", "Sardinia", "Malta", "Corsica"],
      answer: "Corsica",
    },
  ]
}


exports.loadGame = (req, res) => {
  //Session variables to store current question index and number correct
  if(!req.session.gameData) {
    req.session.gameData = {
      category: req.params.category,
      currIndex: 0,
      correct: 0
    }
  }
  question = trivia[req.session.gameData.category];
  question = question[req.session.gameData.currIndex];

  res.render('gamescreen', {
  title: req.params.category.charAt(0).toUpperCase() + req.params.category.substring(1),
         question
  });
};

exports.checkAnswer = (req, res) => {
  const { selectedAnswer, correctAnswer } = req.body;
  const isCorrect = selectedAnswer === correctAnswer;
  //res.json({ correct: isCorrect });

  answer = req.body.answer;
  //category, index, correct = req.session.gameData;
  questions = trivia[req.session.gameData.category];
  question = questions[req.session.gameData.currIndex];

  //Check if the answer was correct
  if(answer === question.answer) {
    req.session.gameData.correct++;
  }
  req.session.gameData.currIndex++;

  //Determine if the game is over
  if(req.session.gameData.currIndex >= questions.length) {
    //Output score, clear current game data
    const score = req.session.gameData.correct;
    const total = questions.length
    delete req.session.gameData;
    return res.render('gameover', {title: "Game Over", score, total});
  }

  question = questions[req.session.gameData.currIndex];
  res.render('gamescreen', {
  title: req.params.category.charAt(0).toUpperCase() + req.params.category.substring(1),
         question
  });
};

