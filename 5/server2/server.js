/**
 * This lab was developed with assistance from ChatGPT-4.
 * ChatGPT was used for debugging, API request improvements, CORS handling, and SQL query fixes.
 * All code was reviewed and tested by me.
 * @author Kenneth Tran A01317266
 */
require('dotenv').config();
const http = require("http");
const mysql = require("mysql2");
const url = require("url");

let db; // Global variable to store connection
let reconnecting = false;
let retryCount = 0;
const MAX_RETRIES = 5; // Maximum reconnection attempts
const RETRY_DELAY = 30000; // 30 seconds before retrying after max attempts

// Function to create a new MySQL connection with proper cleanup
function createDatabaseConnection() {
    if (reconnecting) return; // Prevent multiple reconnections

    if (retryCount >= MAX_RETRIES) {
        console.error(`Max retries (${MAX_RETRIES}) reached. Waiting ${RETRY_DELAY / 1000} seconds before retrying.`);
        setTimeout(() => {
            retryCount = 0; // Reset retries and try again
            createDatabaseConnection();
        }, RETRY_DELAY);
        return;
    }

    reconnecting = true;
    retryCount++;

    if (db) {
        console.log("Closing old MySQL connection before reconnecting...");
        db.end(err => {
            if (err) console.error("Error closing previous MySQL connection:", err.message);
            else console.log("Previous MySQL connection closed.");
            connectToDatabase(); // Once old connection is closed, create a new one
        });
    } else {
        connectToDatabase();
    }
}

// Function to establish a new database connection
function connectToDatabase() {
    db = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        ssl: { rejectUnauthorized: false }
    });

    db.connect(err => {
        if (err) {
            console.error("Error connecting to MySQL:", err.message);
            setTimeout(() => {
                reconnecting = false;
                createDatabaseConnection(); // Retry after 5 seconds
            }, 5000);
        } else {
            console.log("Connected to MySQL database.");
            reconnecting = false; // Reset flag on successful connection
        }
    });

    db.on("error", err => {
        console.error("MySQL connection error:", err.message);
        if (err.code === "PROTOCOL_CONNECTION_LOST" && !reconnecting) {
            console.log("Reconnecting to MySQL...");
            setTimeout(() => {
                reconnecting = false;
                createDatabaseConnection();
            }, 5000);
        }
    });
}

// Create initial database connection
createDatabaseConnection();

// Keep MySQL connection alive
setInterval(() => {
    if (db) {
        db.ping(err => {
            if (err) {
                console.error("MySQL ping failed. Reconnecting...");
                createDatabaseConnection();
            } else {
                console.log("MySQL connection is alive.");
            }
        });
    }
}, 30000); // Ping every 30 seconds

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
