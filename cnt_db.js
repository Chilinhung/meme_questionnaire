const path = require("path");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const cors = require("cors");

/* SQL
ALTER TABLE survey_results
ADD COLUMN ip_address VARCHAR(255),
ADD COLUMN submit_time TIMESTAMP;
*/

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Heroku 會自動設置此環境變量
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          //在 Heroku 上通常需要啟用ssl
          rejectUnauthorized: false,
        }
      : false,
});
// tackle root URL GET requests
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "questions.html"));
});

app.post("/submit", async (req, res) => {
  const responses = req.body.responses; // 獲取前端發送的 responses
  console.log(responses);
  const ipAddress = req.ip;
  const submitTime = new Date().toISOString();
  try {
    for (const response of responses) {
      const { questionId, aspect, value, gender, age, user_text } = response;
      await saveResponse(
        questionId,
        aspect,
        value,
        ipAddress,
        submitTime,
        gender,
        age,
        user_text
      );
    }
    res.send({ status: "success", message: "All responses saved!" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ status: "error", message: "Error saving responses" });
  }
});

async function saveResponse(
  questionId,
  aspect,
  value,
  ip,
  time,
  gender,
  age,
  user_text
) {
  console.log(questionId, aspect, value, ip, time, gender, age, user_text);
  try {
    const query =
      "INSERT INTO survey_results(question_id, aspect, value, ip_address, submit_time, gender, age, user_text) VALUES($1, $2, $3, $4, $5, $6, $7, $8)";
    const result = await pool.query(query, [
      questionId,
      aspect,
      value,
      ip,
      time,
      gender,
      age,
      user_text,
    ]);
    return result;
  } catch (error) {
    console.error("Error saving response:", error);
    throw error;
  }
}


app.get("/api/get_counts", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT question_id, COUNT(*) as response_count FROM survey_results GROUP BY question_id"
    );
    let counts = {};
    result.rows.forEach((row) => {
      let setId = row.question_id.split("_")[0]; // Assuming question_id starts with set id like 'set_1_q1'
      console.log("current search for count is set", setId);
      if (counts[setId]) {
        counts[setId] += 1;
      } else {
        counts[setId] = 1;
      }
    });
    // Normalize counts by number of questions per set if necessary
    Object.keys(counts).forEach((setId) => {
      counts[setId] /= 40; // Adjust this if the number of questions per set varies
    });
    res.json(counts);
  } catch (error) {
    console.error("Error fetching counts:", error);
    res.status(500).send({ status: "error", message: "Error fetching counts" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
