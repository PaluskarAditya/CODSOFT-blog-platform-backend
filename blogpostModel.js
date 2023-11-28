const mongoose = require("mongoose");

const blogpostSchema = new mongoose.Schema({
  img1: String,
  img2: String,
  img3: String,
  title: String,
  author: String,
  user_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User'
  },
  text: {
    type: String,
    required: true
  },
  views: String,
  category: String,
  comments: String,
}, { timestamps: true });

const BlogPost = new mongoose.model('BlogPost', blogpostSchema);
module.exports = BlogPost;