const express = require("express")
const requireLogin = require("../middlewares/requireLogin")
const router = express.Router()

const mongoose = require("mongoose")
const dbURI = require("../db/config")
const Post = require("../db/postModel")
const User = require("../db/userModel")

router.get('/user/:id', requireLogin, async (req,res)=>{
    try{
        const client = await mongoose.connect(dbURI,{useUnifiedTopology:true,useNewUrlParser:true,useFindAndModify:false})
        const user = await User.findById(req.params.id).select("-password")
        if(user){ 
            const posts = await Post.find({postedBy:req.params.id}).populate("postedBy","_id name")
            res.status(200).json({user,posts}) 
        }
        else { 
            res.status(404).json({
                message: "User not found!" 
            }) 
        }
        client.disconnect()
    }
    catch(err){
        res.status(500).json({
            message: err.message
        })
    }
})

router.get('/search-user/:email', requireLogin, async (req,res)=>{
    try{
        const client = await mongoose.connect(dbURI,{useUnifiedTopology:true,useNewUrlParser:true,useFindAndModify:false})
        const user = await User.findOne({email:req.params.email}).select("-password")
        if(user){ 
            res.status(200).json({userId:user._id}) 
        }
        else { 
            res.status(404).json({
                message: "User not found!" 
            }) 
        }
        client.disconnect()
    }
    catch(err){
        res.status(500).json({
            message: err.message
        })
    }
})

router.put('/follow',requireLogin,async (req,res)=>{
    try{
        const client = await mongoose.connect(dbURI,{useUnifiedTopology:true,useNewUrlParser:true,useFindAndModify: false})
        const followerRes = await User.findByIdAndUpdate(req.body.followId,
            {$push: {followers:req.user._id}},{new:true}).select("-password")
        const followingRes = await User.findByIdAndUpdate(req.user._id,
            {$push: {following:req.body.followId}},{new:true}).select("-password")
        if(followerRes && followingRes){
            client.disconnect()
            res.status(202).json({followerRes,followingRes})
        }
        else{
            client.disconnect()
            throw Error
        }
    }
    catch(err){
        res.status(500).json({
            message: "Connection Timeout!"
        })
    }
})

router.put('/unfollow',requireLogin,async (req,res)=>{
    try{
        const client = await mongoose.connect(dbURI,{useUnifiedTopology:true,useNewUrlParser:true,useFindAndModify: false})
        const followerRes = await User.findByIdAndUpdate(req.body.unfollowId,
            {$pull: {followers:req.user._id}},{new:true}).select("-password")
        const followingRes = await User.findByIdAndUpdate(req.user._id,
            {$pull: {following:req.body.unfollowId}},{new:true}).select("-password")
        if(followerRes && followingRes){
            client.disconnect()
            res.status(202).json({followerRes,followingRes})
        }
        else{
            client.disconnect()
            throw Error
        }
    }
    catch(err){
        res.status(500).json({
            message: "Connection Timeout!"
        })
    }
})



module.exports = router