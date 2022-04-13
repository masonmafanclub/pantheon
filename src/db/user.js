// mongoose init
import mongoose from "mongoose";

mongoose.connect("mongodb://localhost:27017/proj");

// mongoose user model/schema (acts as a collection)
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: { type: String, index: true },
    password: String,
    email: String,
    verified: Boolean,
  })
);

export default User;
