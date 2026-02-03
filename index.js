const express = require("express");
const app = express();
const PORT = 8081;
app.get("/", (req, res) => {
    res.send("Backend running...");
});
/* express() → creates server
app.get() → route
/ → endpoint
req → incoming request
res → outgoing response
listen() → start server 
*/ 
app.listen(PORT,() =>{
  console.log(`Server is running on port ${PORT}`);
});

app.get("/api/users", (req, res)=>{
    res.json([
        {id:1, name:"John", age:30},
        {id:2, name:"Jane", age:25},
        {id:3, name:"Bob", age:35}
    ]);
});