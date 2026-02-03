const express = require("express");
const app = express();
const PORT = 8082;

app.use(express.json()); // JSON middleware allows backend to read JSON bodies.

app.listen(PORT,() =>{
  console.log(`Server is running on port ${PORT}`);
});
// get- fetch data 
/*app.get("/api/users", (req, res) => {
   res.json({message: "Fetched users"});
   console.log(req.body);
});
*/
app.get("/api/search", (req, res) => {
    res.json({
        query: req.query,
        message: "Search results fetched."
    })
})

//post - send data
app.post("/api/users", (req, res) => {
    res.json({message: "User created...",
        data: req.body,
    });
});
//
