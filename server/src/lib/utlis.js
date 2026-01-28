/**
 * JWT Token Utility
 * -----------------
 * This file provides a helper function for generating JSON Web Tokens (JWT)
 * and securely attaching them to HTTP-only cookies.
 *
 * It is used as part of the authentication mechanism to maintain
 * user sessions in a secure and stateless manner.
 */
const jwt = require('jsonwebtoken');

/**
 * Generates a JWT for an authenticated user and stores it in a secure cookie.
 * The token contains the user's identifier and is signed using
 * a secret key from environment variables.
 */
const generateToken = (userId, res)=>{
    const token = jwt.sign({userId},process.env.JWT_SECRET, {
        expiresIn:'7d'
    });

    res.cookie('pedaTrain',token,{
        maxAge: 7 * 24 * 60 * 1000, // 7 days in milliseconed
        httpOnly:true, // prevent XSS attacks
        sameSite:'strict', // prevent CSRF attacks
        secure: process.env.NODE_ENV !== 'development' // use https in production
    });
    return token;
};

module.exports = generateToken;

