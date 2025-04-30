const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authsRouter = require("./routes/authsRouter");
const reportRouter = require("./routes/reportRouter");
const profileRouter = require("./routes/profileRouter");
const postsRouter = require("./routes/postsRouter");
const messagesRouter = require("./routes/messagesRouter");
const notificationsRouter = require("./routes/notificationsRouter");
const searchRouter = require("./routes/searchRouter");

require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json({limit: '100mb'}));
app.use(express.urlencoded({extended: true, limit: '100mb'})); 

// return if render server works
// app.get('/', (req,res)=>{      
//   res.json({
//     status:200,     
//     message:'Server Running'
//   })
// });
app.use('/auth', authsRouter);
app.use('/report', reportRouter);
app.use('/profile', profileRouter);
app.use('/posts', postsRouter);
app.use('/messages', messagesRouter);
app.use('/notifications', notificationsRouter);
app.use('/search', searchRouter);

const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 8080;

mongoose.connect(MONGO_URL)
  .then(() => app.listen(PORT, () => console.log(`Server running on port: ${PORT}`)))
  .catch((error) => console.log(error.message));
