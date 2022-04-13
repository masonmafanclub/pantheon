import express from "express";
import mongoose from "mongoose";
import User from "../db/user";
import Media from "../db/media";
const router = express.Router();
const multer = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, '/home/pantheon/uploads');
  },
  filename: function (req, file, callback) {
    callback(null, Date.now()+'-'+file.originalname);
  }
});

const upload = multer({storage: storage})


// upload, name must be 'media'
router.post("/upload", upload.single('media'), async (req, res) => {
  if(req.file){
      // if file received, create mongoDB Media entry, then return that object ID
     // create new user
    let media = new Media({
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      path: req.file.path
    });
    await media.save()
    res.json({mediaid: media._id})
  }
  else{
    console.log('File unsuccessfully uploaded')
    res.status(500).send('File unsuccessfully uploaded')
  }
});
router.use("/access/:id", async (req,res) =>{
  // console.log(mongoose.Types.ObjectId(req.params.id))
  console.log(req.params.id)
  Media.findById(req.params.id).then(function(r){
    console.log(r.path)
    res.sendFile(r.path);
})
  
})
router.use("/test", async (req,res) =>{
  res.send('hit /media/test')
})
export default router;
