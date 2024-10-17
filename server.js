const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authsRouter = require("./routes/authsRouter");
const profileRouter = require("./routes/profileRouter");
const postsRouter = require("./routes/postsRouter");
const messagesRouter = require("./routes/messagesRouter");

require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json({limit: '500mb'}));
app.use(express.urlencoded({extended: true, limit: '500mb'})); 

app.use('/auth', authsRouter);
app.use('/profile', profileRouter);
app.use('/posts', postsRouter);
app.use('/messages', messagesRouter);

const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 8080;

mongoose.connect(MONGO_URL)
  .then(() => app.listen(PORT, () => console.log(`Server running on port: ${PORT}`)))
  .catch((error) => console.log(error.message));
