const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");

const User = require("../../schemas/UserSchema");
const Post = require("../../schemas/PostSchema");
const Notification = require("../../schemas/NotificationSchema");

app.use(bodyParser.urlencoded({ extended: false }));

router.get("/", async (req, res, next) => {
  let searchObj = req.query;
  if (searchObj.isReply !== undefined) {
    let isReply = searchObj.isReply == "true";
    searchObj.replyTo = { $exists: isReply };
    delete searchObj.isReply;
  }
  if (searchObj.search !== undefined) {
    searchObj.content = { $regex: searchObj.search, $options: "i" };
    delete searchObj.search;
  }
  if (searchObj.followingOnly !== undefined) {
    let followingOnly = searchObj.followingOnly == "true";
    if (followingOnly) {
      let objectIds = [];
      if (!req.session.user.following) {
        req.session.user.following = [];
      }
      req.session.user.following.forEach((user) => {
        objectIds.push(user);
      });

      objectIds.push(req.session.user._id);
      searchObj.postedBy = { $in: objectIds };
    }

    delete searchObj.followingOnly;
  }
  let results = await getPosts(searchObj);
  res.status(200).send(results);
});
router.get("/:id", async (req, res, next) => {
  const postId = req.params.id;

  let postData = await getPosts({ _id: postId });
  postData = postData[0];

  let results = {
    postData,
  };
  if (postData.replyTo !== undefined) {
    results.replyTo = postData.replyTo;
  }

  results.replies = await getPosts({ replyTo: postId });
  res.status(200).send(results);
});

router.post("/", async (req, res, next) => {
  if (!req.body.content) {
    console.log("Content param not sent with request");
    return res.sendStatus(400);
  }
  const postData = { content: req.body.content, postedBy: req.session.user };
  if (req.body.replyTo) {
    postData.replyTo = req.body.replyTo;
  }
  Post.create(postData)
    .then(async (newPost) => {
      newPost = await User.populate(newPost, { path: "postedBy" });
      newPost = await Post.populate(newPost, { path: "replyTo" });
      if (newPost.replyTo !== undefined) {
        await Notification.insertNotification(
          newPost.replyTo.postedTo,
          req.session.user._id,
          "reply",
          newPost._id
        );
      }
      res.status(201).send(newPost);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});
router.put("/:id/like", async (req, res, next) => {
  const postId = req.params.id;
  const userId = req.session.user._id;

  const isLiked =
    req.session.user.likes && req.session.user.likes.includes(postId);

  let option = isLiked ? "$pull" : "$addToSet";

  //insert user like
  req.session.user = await User.findByIdAndUpdate(
    userId,
    {
      [option]: { likes: postId },
    },
    { new: true }
  ).catch((error) => {
    console.log(error);
    res.sendStatus(400);
  });

  // inser post like
  const post = await Post.findByIdAndUpdate(
    postId,
    {
      [option]: { likes: userId },
    },
    { new: true }
  ).catch((error) => {
    console.log(error);
    res.sendStatus(400);
  });
  if (!isLiked) {
    await Notification.insertNotification(
      post.postedBy,
      req.session.user._id,
      "postLike",
      post._id
    );
  }
  res.status(200).send(post);
});
router.post("/:id/retweet", async (req, res, next) => {
  const postId = req.params.id;
  const userId = req.session.user._id;

  // Try and delete retweet
  let deletedPost = await Post.findOneAndDelete({
    postedBy: userId,
    retweetData: postId,
  }).catch((error) => {
    console.log(error);
    res.sendStatus(400);
  });
  let option = deletedPost != null ? "$pull" : "$addToSet";
  let repost = deletedPost;

  if (repost == null) {
    repost = await Post.create({ postedBy: userId, retweetData: postId }).catch(
      (error) => {
        console.log(error);
        res.sendStatus(400);
      }
    );
  }

  //insert user like
  req.session.user = await User.findByIdAndUpdate(
    userId,
    {
      [option]: { retweets: repost._id },
    },
    { new: true }
  ).catch((error) => {
    console.log(error);
    res.sendStatus(400);
  });

  // inser post like
  const post = await Post.findByIdAndUpdate(
    postId,
    {
      [option]: { retweetUsers: userId },
    },
    { new: true }
  ).catch((error) => {
    console.log(error);
    res.sendStatus(400);
  });
  if (!deletedPost) {
    await Notification.insertNotification(
      post.postedBy,
      req.session.user._id,
      "retweet",
      post._id
    );
  }

  res.status(200).send(post);
});
router.delete("/:id", (req, res, next) => {
  Post.findByIdAndDelete(req.params.id)
    .then(() => res.sendStatus(202))
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});
router.put("/:id", async (req, res, next) => {
  if (req.body.pinned !== undefined) {
    await Post.updateMany(
      { postedBy: req.session.user },
      { pinned: false }
    ).catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
  }
  Post.findByIdAndUpdate(req.params.id, req.body)
    .then(() => res.sendStatus(204))
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});
async function getPosts(filter) {
  let results = await Post.find(filter)
    .populate("postedBy")
    .populate("retweetData")
    .populate("replyTo")
    .sort({ createdAt: -1 })
    .catch((error) => {
      console.log(error);
    });
  results = await User.populate(results, {
    path: "replyTo.postedBy",
  });
  return (results = await User.populate(results, {
    path: "retweetData.postedBy",
  }));
}
module.exports = router;
