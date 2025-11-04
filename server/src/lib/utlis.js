const jwt = require('jsonwebtoken');

const generateToken = (userId, res)=>{
    const token = jwt.sign({userId},process.env.JWT_SECRET, {
        expiresIn:'7d'
    });

  res.cookie('pedaTrain', token, {
  httpOnly: true,
  secure: true,        // חובה בפרודקשן + HTTPS
  sameSite: 'None',    // חובה כששולחים לדומיין אחר
  maxAge: 7 * 24 * 60 * 60 * 1000
});
    return token;
};

module.exports = generateToken;


    // res.cookie('pedaTrain',token,{
    //     maxAge: 7 * 24 * 60 * 1000, // 7 days in milliseconed
    //     httpOnly:true, // prevent XSS attacks
    //     sameSite:'strict', // prevent CSRF attacks
    //     secure: process.env.NODE_ENV !== 'development' // use https in production
    // });