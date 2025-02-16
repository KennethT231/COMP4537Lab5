require('dotenv').config();
const http = require("http");
const mysql = require("mysql2");
const url = require("url");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }  
});

db.connect(err => {
    if (err) throw err;
    console.log("Connected to database.");
    
    const createTable = `CREATE TABLE IF NOT EXISTS patient (
        patientid INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        dateOfBirth DATETIME NOT NULL
    ) ENGINE=InnoDB`;

    db.query(createTable, err => {
        if (err) throw err;
        console.log("Table ensured.");
    });
});

const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "POST" && req.url === "/lab5/api/v1/sql") {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            const { query } = JSON.parse(body);
            
            if (!query.toUpperCase().startsWith("INSERT")) {
                res.end(JSON.stringify({ error: "Only INSERT allowed via POST" }));
                return;
            }

            db.query(query, (err, result) => {
                if (err) res.end(JSON.stringify({ error: err.message }));
                else res.end(JSON.stringify({ success: "Data inserted!" }));
            });
        });

    } else if (req.method === "GET" && req.url.startsWith("/lab5/api/v1/sql/")) {
        const query = decodeURIComponent(req.url.split("/lab5/api/v1/sql/")[1]);

        if (!query.toUpperCase().startsWith("SELECT")) {
            res.end(JSON.stringify({ error: "Only SELECT allowed via GET" }));
            return;
        }

        db.query(query, (err, results) => {
            if (err) res.end(JSON.stringify({ error: err.message }));
            else res.end(JSON.stringify(results));
        });

    } else {
        res.end(JSON.stringify({ error: "Invalid request" }));
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
