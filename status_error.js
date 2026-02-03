const express = require("express");
const app = express();
const PORT = 8082;

app.use(express.json());



app.get("/api/users", (req, res) => {
    res.status(200).json({
        success: true,
        message: "user fetched succesfully",
    });
});

app.post("/api/users", (req,res)=>{
    console.log("✅ POST /api/users HIT");


    const { name, email} = req.body;
// validation (never trust incoming data).
    if(!name || !email){
        return res.status(400).json({
            success: false,
            message: "Name and Email are required",
        });
    }
    res.status(201).json({
        success: true,
        message: "User created succesfully",
        data: {name, email},
    });
});
//handles not found.
app.use((req, res)=>{
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

//basic error handling (catches unexpected crashes).
app.use((err, req, res, next)=>{
    console.log(err);
    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
});

app.listen(PORT, ()=>{
    console.log(`Server is running on PORT ${PORT}`);
});