require("dotenv").config();
const express = require('express');
const cors = require('cors');

const connectDB = require("./config/db");
const authRoutes = require("./routes/authroutes");

const app = express();
const PORT = 3000;

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth",authRoutes);

app.listen(PORT, "0.0.0.0",()=>{
    console.log(`server is running on http://localhost:${PORT}`);
});

