"use strict";
const express = require("express");
const path = require('path');
const port = 8000;
const app = express();
console.log("path: " + path.join(path.join(__dirname, "../"), "models"));
app.use("/scripts", express.static(path.join(__dirname, "graphics")));
app.use("/models", express.static(path.join(path.join(__dirname, "../"), "models")));
app.get("/", (req, res) => {
    res.sendFile("views/index.html", { root: "./" });
});
// start the Express server
app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});
