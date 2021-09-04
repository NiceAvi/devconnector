const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");

//models
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route POST api/posts
// @desc  create a post
// @access Private
router.post(
    "/",
    [auth, [check("text", "Text is required").not().isEmpty()]],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user.id).select("-password");

            const newPost = new Post({
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id,
            });

            const post = await newPost.save();
            res.json(post);

        } catch (error) {
            console.error(error.message);
            res.status(500).send("Server error: " + error);
        }
    }
);

// @route GET api/posts
// @desc  Get all post
// @access Private
router.get('/', auth, async (req, res) => {
    try {
        const post = await Post.find().sort({ date: -1 });
        res.json(post);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error: " + error);
    }
})


// @route GET api/posts/:id
// @desc  Get all post by id
// @access Private
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(post);
    } catch (error) {
        console.error(error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(500).send("Server error: " + error);
    }
})



// @route DELETE api/posts/:id
// @desc  Get all post by id
// @access Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not Authorized' });
        }
        await post.remove();
        res.json({ message: 'Post removed successfully' });
    } catch (error) {
        console.error(error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(500).send("Server error: " + error);
    }
});


// @route PUT api/posts/like/:id
// @desc  Like a post
// @access Private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // checkif the post has already been liked
        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ message: 'Post already liked.' });
        }
        post.likes.unshift({ user: req.user.id });
        await post.save();
        res.json(post.likes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error: " + error);
    }
});


// @route PUT api/posts/unlike/:id
// @desc  Like a post
// @access Private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // checkif the post has already been liked
        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({ message: 'Post has not yet been liked.' });
        }
        // Get remove index from
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
        post.likes.splice(removeIndex, 1);

        await post.save();
        res.json(post.likes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error: " + error);
    }
});


// @route POST api/posts/comment/:id
// @desc  comment a post
// @access Private
router.post(
    "/comment/:id",
    [auth, [check("text", "Text is required").not().isEmpty()]],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user.id).select("-password");
            const post = await Post.findById(req.params.id);
            const newComment = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id,
            };
            post.comments.unshift(newComment);
            await post.save();
            res.json(post.comments);

        } catch (error) {
            console.error(error.message);
            res.status(500).send("Server error: " + error);
        }
    }
);

// @route DELETE api/posts/comment/:post_id/comment_id
// @desc  delete comment a post
// @access Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Pull out comment
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        // Make sure comment exists
        if (!comment) {
            return res.status(404).json({ message: 'Comment does not exist' });
        }

        // Check user
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        // Get remove index
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
        post.comments.splice(removeIndex, 1);
        await post.save();
        res.json(post.comments);


    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error: " + error);
    }
})

module.exports = router;
