const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());

app.get("/images", async (req, res) => {
  try {
    const url =
      "https://raw.githubusercontent.com/Chilinhung/meme_questionnaire/tree/main/question_set.json";
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).send(error.message);
  }
});

app.listen(3000, () => {
  console.log("CORS-enabled web server listening on port 3000");
});
