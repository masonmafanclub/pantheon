// mongoose init
import mongoose from "mongoose";

mongoose.connect("mongodb://localhost:27017/proj");

// mongoose user model/schema (acts as a collection)
const Media = mongoose.model(
  "Media",
  new mongoose.Schema({
    filename: String,
    originalname: String,
    mimetype: String,
    path: String
  })
);

export default Media;
