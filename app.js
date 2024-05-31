const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const path = require('path');
require('./config/database')();
require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const adminrouter = require('./routers/adminRouter');
const shopRouter = require('./routers/shopRouter');
const authrouter = require('./routers/authRouter');
const userRouter = require('./routers/userRouter')
const moment = require('moment');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');
app.set('views', 'views');


app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    resave: false,
    secret: process.env.KEY,
    saveUninitialized: false
}));
app.use(flash());



const shortDateFormat = 'MMM Do YY';
app.locals.moment = moment;
app.locals.shortDateFormat = shortDateFormat;

app.use(authrouter);
app.use('/admin', adminrouter);
app.use('/user',userRouter)
app.use('/', shopRouter);







app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});


const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
    console.log(`Server connected at http://localhost:${PORT}/`);
});
