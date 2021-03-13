const express = require("express")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cors())

app.use("/",express.static("public"))


const authRouter = require("./routes/auth")
const postRouter = require("./routes/post")
const userRouter = require("./routes/user")

app.use("/api",authRouter)
app.use("/api/",postRouter)
app.use("/api/",userRouter)


const port = process.env.PORT || 5000

app.listen(port,()=>{
    console.log("Server running at http://localhost:"+port)
})
