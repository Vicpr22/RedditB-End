import { prisma } from "../index.js";
import express from "express";

export const postRouter = express.Router();

postRouter.get("/", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        subreddit: true,
        children: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        downvotes: true,
        upvotes: true,
      },
    });

    res.send({ success: true, posts });
  } catch (error) {
    // Handle errors in fetching posts
    console.error("Error in GET /posts:", error);
    res.status(500).send({ success: false, error: "Internal server error" });
  }
});

postRouter.post("/", async (req, res) => {
  try {
    const { title, text, subredditId, parentId } = req.body;

    const newPost = await prisma.post.create({
      data: {
        title,
        text,
        userId: req.user.id,
        subredditId,
        parentId,
      },
    });

    res.send({ success: true, post: newPost });
  } catch (error) {
    console.error("Error in POST /posts:", error);
    res.status(500).send({ success: false, error: "Internal server error" });
  }
});

postRouter.put("/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;
    const { title, text } = req.body;

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { title, text },
    });

    if (!updatedPost) {
      return res.status(404).send({ success: false, error: "Post not found" });
    }

    if (!text) {
      return res.send({
        success: false,
        error: "Please provide some text to update!",
      });
    }

    if (!req.user) {
      return res.send({
        success: false,
        error: "Please login to delete.",
      });
    }
    //Checks if post Exists
    let post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.send({ success: false, error: "Post doesn't exist" });
    }

    if (userId !== post.userId) {
      return res.send({
        success: false,
        error: "You must be the owner of this post to delete!",
      });
    }

    res.send({ success: true, post: updatedPost });
  } catch (error) {
    console.error("Error in PUT /posts/:id:", error);
    res.status(500).send({ success: false, error: "Internal server error" });
  }
});

postRouter.delete("/:postId", async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    if (!req.user) {
      return res.send({
        success: false,
        error: "Please login to delete.",
      });
    }
    //Checks if post Exists
    let post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.send({ success: false, error: "Post doesn't exist" });
    }

    if (userId !== post.userId) {
      return res.send({
        success: false,
        error: "You must be the owner of this post to delete!",
      });
    }

    post = await prisma.post.delete({
      where: {
        id: postId,
      },
    });

    res.send({ success: true, post });
  } catch (error) {
    res.send({ error: error.message });
  }
});
