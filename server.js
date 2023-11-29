const express = require('express');
const app = express();
const cors = require('cors');
const BlogPost = require('./blogpostModel');
const User = require('./userModel');
const auth = require('./authMiddleware');
const bcrypt = require('bcrypt'); ``
const conn = require('./db');
const jwt = require('jsonwebtoken');
const Comment = require('./commentModel');
require('dotenv').config();

app.use(express.json({ limit: '10mb' }));
app.use(cors());
conn();

// Generates a jwt token
const token = (id) => {
  return jwt.sign(id, process.env.JWT_SECRET);
}

// test request
app.get('/', (req, res) => res.send('Hi'));

// @GET -> get random blogpost
app.get('/api/blogs/random', async (req, res) => {
  try {
    const randomBlogPost = await BlogPost.aggregate([{ $sample: { size: 1 } }]);

    if (!randomBlogPost || randomBlogPost.length === 0) {
      res.status(404).json({ err: "No blogposts found" });
    } else {
      res.status(200).json(randomBlogPost[0]);
    }

  } catch (error) {
    console.log(error.message);
  }
})

// @GET -> get blogs for specific user
app.get('/api/blogs/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const blogs = await BlogPost.find({ user_id: id });
    if (!blogs) {
      res.status(404).json({err: "No blogposts found"})
    } else {
      res.status(200).json(blogs);
    }
  } catch (error) {
    console.log(error.message);
  }
});

// @POST -> create a blogpost
app.post('/api/blogs/create', auth, async (req, res) => {
  try {
    const { img1, img2, img3, title, text, category, author } = req.body;
    const blog = await new BlogPost({
      user_id: req.id,
      text: text.trim(),
      img1,
      img2,
      img3,
      author,
      category,
      title,
    })
    if (blog) {
      await blog.save();
      res.json(blog);
    } else {
      res.json({ err: "failed to create post, please try again" });
    }
  } catch (error) {
    console.log(error.message);
  }
})

// @GET -> get blogpost by id
app.get('/api/getblog/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await BlogPost.findById(id);

    if (!blog) {
      res.status(404).json({err: "no blogpost found"});
    } else {
      res.status(200).json(blog);
    }
  } catch (error) {
    console.log(error.message);
  }
})

// @GET -> get blogposts according to limit param
app.get('/api/blogs/:limit', async (req, res) => {
  try {
    const { limit } =req.params;
    const blogs = await BlogPost.find({ size: limit });
    if (!blogs) {
      res.status(404).json({err: "no blogposts found"});
    } else {
      res.status(200).json(blogs);
    }
  } catch (error) {
    console.log(error.message)
  }
})

// @GET -> get blogposts according to category

// @GET -> get most viewed blogpost

// @POST -> user login
app.post('/api/user/login', async (req, res) => {
  try {
    const { uname, pass } = req.body;
    if (!uname || !pass) {
      res.json({ err: 'please fill all fields' });
    }
    const usr = await User.findOne({ username: uname });
    if (!usr) {
      res.json({ err: 'user not found' });
    } else if (usr && await bcrypt.compare(pass, usr.password)) {
      res.json({ success: 'logged in', user: usr, token: token(usr.id) });
    } else if (await bcrypt.compare(pass, usr.password) !== true) {
      res.json({ err: 'invalid data' });
    }
  } catch (error) {
    console.log(error.message);
  }
})

// @POST -> signup a user
app.post('/api/user/register', async (req, res) => {
  try {
    const { name, email, uname, pass } = req.body;
    if (!uname || !pass || !email) {
      res.json({ err: 'please fill all fields' });
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(pass, salt);
      const user = await User({
        name,
        username: uname,
        email,
        password: hashed,
      })
      user.save()
      user ? res.json({ user: user, token: token(user.id) }) : res.json({ err: 'please try again' });
    }
  } catch (error) {
    console.log(error.message);
  }
})

// @GET -> get random blogs according to limit
app.get('/api/blogs/random/:limit', async (req, res) => {
  const limit = parseInt(req.params.limit);

  try {
    const uniqueBlogPosts = await BlogPost.aggregate([
      { $sample: { size: limit } }, // Sample the specified number of documents randomly
      { $group: { _id: '$title', data: { $first: '$$ROOT' } } }, // Group by title to ensure uniqueness
      { $replaceRoot: { newRoot: '$data' } }, // Replace the root with the original document
    ]);

    res.json(uniqueBlogPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// @GET -> get all blogposts
app.get('/api/blogs', async (req, res) => {
  try {
    const blogs = await BlogPost.find();
    if (blogs) {
      res.status(200).json(blogs);
    } else {
      res.status(404).json({err: "no blogposts found"});
    }
  } catch (error) {
    console.log(error.message);
  }
})

// @POST -> edit and update an existing blog
app.post('/api/blogs/update/:id', auth, async (req, res) => {
  try {
    const { img1, text, title } = req.body;
    const { id } = req.params;
    const blog = await BlogPost.findByIdAndUpdate(id, {
      img1,
      text,
      title
    });
    
    if (!blog) {
      res.status(404).json({err: "no blogpost found"});
    } else {
      await blog.save();
      res.status(200).json(blog);
    }
  } catch (error) {
    console.log(error.message);
  }
})

// @POST -> edit and update fields like username, image and name of a exisiting user
app.post('/api/users/update/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, userimg } = req.body;
    const user = await User.findByIdAndUpdate(id, {
      name,
      username
    });
    if (!user) {
      res.status(404).json({err: "user not found"});
    } else {
      res.status(200).json(user);
    }
  } catch (error) {   
    console.log(error.message);
  }
});

// @POST -> add comment to a post
app.post('/api/blogs/comments/add/:commid', auth, async (req, res) => {
  try {
    const id = req.id;
    console.log(id);
    const { commid } = req.params;
    const { comm, username } = req.body;

    const comment = await Comment({
      user_id: id,
      blog_id: commid,
      comment: comm,
      username
    });

    if (comment) {
      await comment.save();
      res.status(200).json(comment);
    } else {
      res.status(500).json({err: "internal server error, please try again"});
    }
  } catch (error) {
    console.log(error.message);
  }
})

// @GET -> get all comments on a specifc blog
app.get('/api/blogs/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await Comment.find({ blog_id: id });
    if (!comments) {
      res.json({err: "no comments found"})
    } else {
      res.status(200).json(comments);
    }
  } catch (error) {
    console.log(error.message);
  }
})

app.delete('/api/blogs/comments/remove/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const del = await Comment.findByIdAndDelete(id);
    if (!del) {
      res.json(del);
    } else {
      res.json({err: "error in deleting post"});
    }
  } catch (error) {
    console.log(error.message);
  }
})

app.listen(8080, console.log('Listening on 8080'));