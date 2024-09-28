const path = require("path");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const cors = require("cors");

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "questions.html"));
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

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

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 新增路由來獲取每個set的填答人數
app.get(
  "/set-counts" /*https://meme-servey-v2-1d925ee162ce.herokuapp.com*/,
  async (req, res) => {
    console.log("Received request for /set-counts");
    try {
      const query = `
      SELECT DISTINCT ON (set_num) set_num, COUNT(DISTINCT ip_address) as response_count
      FROM (
        SELECT SUBSTRING(question_id FROM '^set_\\d+') as set_num, ip_address
        FROM survey_results
      ) as subquery
      GROUP BY set_num
      ORDER BY set_num;
    `;
      const result = await pool.query(query);
      console.log("Query result:", result.rows);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching set counts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
