const apiUrl = "https://monkfish-app-ym6ah.ondigitalocean.app/lab5/api/v1/sql";

// Insert Data (POST Request)
document.getElementById("insertData").addEventListener("click", async () => {
    const query = `INSERT INTO patient (name, dateOfBirth) VALUES 
        ('Sara Brown', '1901-01-01'), 
        ('John Smith', '1941-01-01'), 
        ('Jack Ma', '1961-01-30'), 
        ('Elon Musk', '1999-01-01')`;

    const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
    });

    document.getElementById("response").innerText = await response.text();
});

// Run Custom SQL Query (GET or POST)
document.getElementById("runQuery").addEventListener("click", async () => {
    const query = document.getElementById("sqlQuery").value.trim();

    if (query.toUpperCase().startsWith("SELECT")) {
        const response = await fetch(`${apiUrl}/${encodeURIComponent(query)}`);
        document.getElementById("response").innerText = await response.text();
    } else if (query.toUpperCase().startsWith("INSERT")) {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });
        document.getElementById("response").innerText = await response.text();
    } else {
        alert("Only SELECT or INSERT queries are allowed!");
    }
});
