const express = require("express");
const authRoutes = require("./routes/auth.route");
const cors = require("cors");
const ConnectDB = require("./lib/db");
const dotenv = require('dotenv');
const cookieParser = require("cookie-parser");

const PORT = 3001;

dotenv.config()
const app = express();
app.use(express.json());
app.use(cookieParser());      

app.use(cors({
    origin:'http://localhost:3000',
    credentials:true
}))

app.use('/api/auth',authRoutes);

app.listen(PORT, ()=>{
    console.log(`server started at port: ${PORT}`);
    ConnectDB();
});

