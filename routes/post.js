const express = require("express")
const requireLogin = require("../middlewares/requireLogin")
const router = express.Router()

const mongoose = require("mongoose")
const dbURI = require("../db/config")
const Post = require("../db/postModel")

router.get("/allPost",requireLogin,async (req,res)=>{
    try{
        const client = await mongoose.connect(dbURI,{useUnifiedTopology:true,useNewUrlParser:true,useFindAndModify:false})
        const posts = await Post.find().populate("postedBy","_id name").populate("comments.postedBy","_id name").sort('-createdAt')

        client.disconnect()
        res.status(200).json(posts)
    }
    catch(err){
        res.status(500).json({
            message: err.message
        })
    }
})

router.get("/myPost",requireLogin,async (req,res)=>{
    try{
        const client = await mongoose.connect(dbURI,{useUnifiedTopology:true,useNewUrlParser:true,useFindAndModify:false})
        const posts = await Post.find({postedBy:req.user._id}).populate("postedBy","_id name").sort('-createdAt')

        client.disconnect()
        res.status(200).json(posts)
    }
    catch(err){
        res.status(500).json({
            message: err.message
        })
    }
})

router.get("/myFollowingPost",requireLogin,async (req,res)=>{
    try{
        const client = await mongoose.connect(dbURI,{useUnifiedTopology:true,useNewUrlParser:true,useFindAndModify:false})
        const posts = await Post.find({postedBy: {$in: req.user.following}})
        .populate("postedBy","_id name").populate("comments.postedBy","_id name").sort('-createdAt')

        client.disconnect()
        res.status(200).json(posts)
    }
    catch(err){
        res.status(500).json({
            message: err.message
        })
    }
})

router.post('/createPost',requireLogin,async (req,res)=>{
    try{
        const {title,photo} = req.body
        if(!title || !photo){
            res.status(422).json({
                message: "Add all the fields"
            })
            return
        }

        const client = await mongoose.connect(dbURI,{useUnifiedTopology:true,useNewUrlParser:true,useFindAndModify:false})
        const post = new Post({
            title,
            photo,
            postedBy:req.user
        })
        await post.save()

        client.disconnect()
        res.status(201).json({
            message: "Posted successfully",
        })
    }
    catch(err){
        res.status(500).json({
            message: "Connection Timeout!"
        })
    }
})

router.put('/like',requireLogin,async (req,res)=>{
    try{
        const client = await mongoose.connect(dbURI,{useUnifiedTopology:true,useNewUrlParser:true,useFindAndModify: false})
        const postResult = await Post.findByIdAndUpdate(req.body.postId,
            {$push: {likes:req.user._id}},{new:true}).populate("postedBy","_id name").populate("comments.postedBy","_id name")
        if(postResult){
            client.disconnect()
            res.status(202).json(postResult)
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

router.put('/unlike',requireLogin,async (req,res)=>{
    try{
        const client = await mongoose.connect(dbURI,{useUnifiedTopology:true,useNewUrlParser:true,useFindAndModify:false})
        const postResult = await Post.findByIdAndUpdate(req.body.postId,
            {$pull: {likes:req.user._id}},{new:true}).populate("postedBy","_id name").populate("comments.postedBy","_id name")
        if(postResult){
            client.disconnect()
            res.status(202).json(postResult)
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

router.put('/comment',requireLogin,async (req,res)=>{
    try{
        const comment = {
            text: req.body.text,
            postedBy: req.user._id
        }
        const client = await mongoose.connect(dbURI,{useUnifiedTopology:true,useNewUrlParser:true,useFindAndModify: false})
        const postResult = await Post.findByIdAndUpdate(req.body.postId,
            {$push: {comments:comment}},{new:true}).populate("postedBy","_id name").populate("comments.postedBy","_id name")
        if(postResult){
            client.disconnect()
            res.status(202).json(postResult)
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

router.delete('/delete/:postId',requireLogin,async (req,res)=>{
    try{
        const client = await mongoose.connect(dbURI,{useUnifiedTopology:true,useNewUrlParser:true,useFindAndModify: false})
        const post = await Post.findById(req.params.postId).populate("postedBy","_id")
        if(post && post.postedBy._id.toString()===req.user._id.toString()){
            const remPost = await post.remove()
            res.status(200).json(remPost)
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