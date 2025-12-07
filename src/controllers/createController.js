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
const supabase = require('../supabase');


/**
 * Controller: loadCreate
 * Purpose: Render the "Create New Game" page if the user is authenticated
 * Input: req.session.user (object), req.csrfToken()
 * Output: Renders /create OR redirects to home if not logged in
 */
exports.loadCreate = (req, res) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] [GameCreationController] START loadCreate`);

    try {
        // Only lets a user see this page if they are logged in
        if (req.session.user) {
            console.log(`[${ts}] [GameCreationController] User authenticated. Rendering Create page.`);
            res.render('Create', {
                title: 'Create New Game',
                csrfToken: req.csrfToken()
            });
            console.log(`[${ts}] [GameCreationController] END loadCreate`);
        }
        else {
            console.log(`[${ts}] [GameCreationController] User not logged in. Redirecting home.`);
            console.log(`[${ts}] [GameCreationController] END loadCreate`);
            return res.redirect("/");
        }

    } catch (err) {
        console.error(`[${ts}] [GameCreationController] UNEXPECTED ERROR in loadCreate: ${err.message}`);
        return res.render("error", { title: "Error" });
    }
};


/**
 * Controller: addGame
 * Purpose: Insert a new game and its associated questions into the database
 * Input: req.body.title, req.body.description, req.body.questions (array/object)
 * Output: Redirects to "/" on success OR redirects to "/create" on failure
 */
exports.addGame = async (req, res) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] [GameCreationController] START addGame`);

    try {
        let { title, description, questions } = req.body;

        console.log(`[${ts}] [GameCreationController] Received form data for new game: title="${title}"`);

        if (!questions) {
            console.log(`[${ts}] [GameCreationController] No questions provided.`);
            questions = [];
        } else if (!Array.isArray(questions)) {
            console.log(`[${ts}] [GameCreationController] Questions provided as object. Converting to array.`);
            questions = Object.values(questions);
        }

        const slug = title.replaceAll(' ', '-').toLowerCase();
        console.log(`[${ts}] [GameCreationController] Generated slug: ${slug}`);

        // Insert Game 
        let data;
        try {
            console.log(`[${ts}] [GameCreationController] Inserting new game into database...`);
            const result = await supabase
                .from("games")
                .insert([
                    { 
                        title: title, 
                        description: description, 
                        slug: slug, 
                        user_id: req.session.user.id 
                    },
                ])
                .select();

            if (result.error) throw result.error;
            data = result.data;

        } catch (err) {
            console.error(`[${ts}] [GameCreationController] ERROR inserting game: ${err.message}`);
            console.log(`[${ts}] [GameCreationController] END addGame`);
            return res.render("error", { title: "Error" });
        }

        const id = data[0].id;
        console.log(`[${ts}] [GameCreationController] Game inserted with ID: ${id}. Beginning question inserts...`);

        // Insert Questions
        for (const curr of questions) {
            try {
                const result = await supabase
                    .from("questions")
                    .insert([{
                        game_id: id,
                        question: curr.question,
                        option_a: curr.option_a,
                        option_b: curr.option_b,
                        option_c: curr.option_c,
                        option_d: curr.option_d,
                        answer: curr.correct_answer
                    }]);

                if (result.error) {
                    throw result.error;
                }

            } catch (err) {
                console.error(`[${ts}] [GameCreationController] ERROR inserting question: ${err.message}`);
                return res.render("error", { title: "Error" });
            }
        }

        console.log(`[${ts}] [GameCreationController] All questions processed. Redirecting home.`);
        console.log(`[${ts}] [GameCreationController] END addGame`);
        return res.redirect("/");

    } catch (err) {
        console.error(`[${ts}] [GameCreationController] UNEXPECTED ERROR in addGame: ${err.message}`);
        return res.render("error", { title: "Error" });
    }
};
