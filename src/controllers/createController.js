/**
 * Game Creation Controller
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
const supabase = require('../app');

/**
 * GET /
 * Display the home page
 */
exports.loadCreate = (req, res) => {
    // Only lets a user see this page if they are logged in
    if (req.session.user) {
        res.render('Create', {
            title: 'Create New Game',
        });
    }
    else {
        return res.redirect("/");
    }
};

exports.addGame = async (req, res) => {
    const { title, description, questions } = req.body;
    const slug = title.replaceAll(' ', '-').toLowerCase();


    const { data, error } = await supabase
        .from("games")
        .insert([
            { title: title, description: description, slug: slug },
        ])
        .select();
    if (error) {
        console.log("database error");
    }

    const id = data[0].id;

    for (const curr of questions) {
        const { data, error } = await supabase
            .from("questions")
            .insert([{
                game_id: id, question: curr.question,
                option_a: curr.option_a, option_b: curr.option_b,
                option_c: curr.option_c, option_d: curr.option_d, answer: curr.correct_answer
            },])
            .select();

        if (error) {
            console.log(error);
        }
    }
    return res.redirect("/");
};