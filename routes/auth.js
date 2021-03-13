const express = require("express")
const bcrypt = require("bcryptjs")
const crypto = require('crypto')
const nodemailer = require('nodemailer')
require('dotenv').config()

const router = express.Router()

const mongoose = require("mongoose")
const dbURI = require("../db/config")
const User = require("../db/userModel")

const transporter = nodemailer.createTransport({
    service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
})

router.post("/signup",async (req,res)=>{
    try{
        const {name,email,password,image} = req.body

        if(!name || !email || !password || !image){
            res.status(422).json({
                message: "All fields are required!"
            })
            return
        }

        const client = await mongoose.connect(dbURI,{useUnifiedTopology:true,useNewUrlParser:true,useFindAndModify:false})
        const savedUser = await User.findOne({email})
        if(savedUser) { 
            res.status(422).json({
                message: "User Id already exists!"
            })
            return
        }

        const hashPwd = bcrypt.hashSync(password,12)
    
        const user = new User({
            email,
            password: hashPwd,
            name,
            image
        })
    
        await user.save()

        client.disconnect()
        res.status(201).json({
            message: "Registered successfully!"
        })
    }
    catch(err){
        res.status(500).json({
            message: "Connection Timeout!"
        })
    }
})


const createJWTToken = require("../modules/createToken")

router.post("/signin",async (req,res)=>{
    try{
        const {email,password} = req.body
        if(!email || !password){
            res.status(422).json({
                message: "All fields are required!"
            })
            return
        }

        const client = await mongoose.connect(dbURI,{useUnifiedTopology:true,useNewUrlParser:true,useFindAndModify:false})
        const savedUser = await User.findOne({email})
        if(!savedUser){
            res.status(422).json({
                message: "Invalid email or password!"
            })
            return
        }

        if(!bcrypt.compareSync(password,savedUser.password)){
            res.status(422).json({
                message: "Invalid email or password!"
            })
            return
        }

        const token = createJWTToken({_id:savedUser._id})
        const {_id,name,followers,following,image} = savedUser

        client.disconnect()
        res.status(200).json({
            message: "Signin success!",
            token,
            user:{_id,name,email,followers,following,image}
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            message: "Connection Timeout!"
        })
    }
})


router.post("/reset-password", async(req,res)=>{
    try{
        const client = await mongoose.connect(dbURI,{useUnifiedTopology:true,useNewUrlParser:true,useFindAndModify:false})
        const resetPasswordToken = await crypto.randomBytes(32).toString('hex')
        const user = await User.findOne({email:req.body.email})
        if(user){
            user.resetPasswordToken = resetPasswordToken
            user.tokenExpire = Date.now() + 3600000
            await user.save()
            transporter.sendMail({
                to: user.email,
                from: "no-reply@insta-clone.com",
                subject: "Password reset",
                html: `
                      <p> You have requested for password reset</p>
                      <p> Click <a href='https://insta-clone-frontend-app.herokuapp.com/change-password/${resetPasswordToken}' target="_blank"> here </a> to reset password </p>
                      <p> This link will expire in one hour. </p>
                      <p> If you have not requested to change password ignore the mail. </p>
                `
            })
            res.status(200).json({
                message: 'Check mail for password recovery link'
            }) 
        }
        else{
            res.status(422).json({
                message: "Email not registered"
            })
        }
    }
    catch(e){
        console.log(err)
        res.status(500).json({
            message: "Connection Timeout!"
        })
    }
})

router.post("/change-password", async (req,res)=>{
    try{
        const client = await mongoose.connect(dbURI,{useUnifiedTopology:true,useNewUrlParser:true,useFindAndModify:false})
        const user = await User.findOne({resetPasswordToken:req.body.token,tokenExpire:{$gt:Date.now()}})
        if(user){
             user.password = bcrypt.hashSync(req.body.password,10)
             user.resetPasswordToken = undefined
             user.tokenExpire = undefined
             await user.save()
             res.status(200).json({
                 message: "Password updated successfully!"
             })
        }
        else{
            res.status(422).json({
                message: "Link expired!"
            })
        }
    }
    catch(e){
        console.log(err)
        res.status(500).json({
            message: "Connection Timeout!"
        })
    }
})


module.exports = router