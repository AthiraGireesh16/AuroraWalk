const User = require('../model/userModels');

module.exports = {
    isBlocked: async (req, res, next) => {
        try {
            if (req.session.user) {
                const userId = req.session.user; // Assuming req.session.user contains the user's ID
                
                const user = await User.findById(userId);
                
                if (!user.isBlocked) {
                    next(); // User is not blocked, proceed to the next middleware
                } else {
                    req.session.destroy((err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            res.redirect('/access-denied'); // Redirect to a different route after destroying the session
                        }
                    });
                }
            } else {
                next(); // No user session, proceed to the next middleware
            }
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Internal Server Error');
        }
    }
};
