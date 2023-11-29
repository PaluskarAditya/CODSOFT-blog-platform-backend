const mongoose = require("mongoose");

const commentSchema = mongoose.Schema({
  user_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User'
  },
  blog_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'BlogPost' 
  },
  username: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: true
  }
});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;