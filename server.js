const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authsRouter = require("./routes/authsRouter")
const postsRouter = require("./routes/postsRouter")
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json({limit: '500mb'}));
app.use(express.urlencoded({extended: true, limit: '500mb'})); 

app.use('/auth', authsRouter);
app.use('/posts', postsRouter);

const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URL)
  .then(() => app.listen(PORT, () => console.log(`Server running on port: ${PORT}`)))
  .catch((error) => console.log(error.message));
