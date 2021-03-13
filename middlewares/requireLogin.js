const jwt = require("jsonwebtoken")
const secret = "sadfgs"

const mongoose = require("mongoose")
const dbURI = require("../db/config")
const User = require("../db/userModel")

const requireLogin = async (req,res,next) =>{
    try{
        const bearer = req.headers.authorization
        if(!bearer){
            res.status(401).json({
                message: "You must be logged in"
            })
            return
        }
    
        await mongoose.connect(dbURI,{useUnifiedTopology:true,useNewUrlParser:true})
    
        jwt.verify(bearer,secret, async (err,payload)=>{
            if(err){
                res.status(401).json({
                    message: "You must be logged in!"
                })
                return
            }
    
            const {_id} = payload
            const userData = await User.findById(_id)
            req.user = {"_id":userData._id,"email":userData.email,"name":userData.name, "following": userData.following}
            next()
        })
    }
    catch(err){
        res.status(500).json({
            message: err.message
        })
    }   
}

module.exports = requireLogin