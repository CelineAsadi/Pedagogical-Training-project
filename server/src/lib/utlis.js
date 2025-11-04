/*const jwt = require('jsonwebtoken');

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

module.exports = generateToken;*/
const jwt = require('jsonwebtoken');

const generateToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });

    res.cookie('pedaTrain', token, {
        httpOnly: true,         // מגן מפני XSS
        secure: process.env.NODE_ENV !== 'development', // true ב-Production (HTTPS חובה)
        sameSite: 'none',       // מאפשר בין דומיינים (Vercel ↔ Render)
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ימים
    });

    return token;
};

module.exports = generateToken;
