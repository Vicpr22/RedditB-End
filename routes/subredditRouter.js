import express from "express";
import { prisma } from "../index.js";

export const subredditRouter = express.Router();

subredditRouter.get("/", async (req, res) => {
  const subreddits = await prisma.subreddit.findMany();
  res.send({
    success: true,
    subreddits,
  });
});

subredditRouter.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.send({
        success: false,
        error: "Please include a name when creating a subreddit",
      });
    }

    if (!req.user) {
      return res.send({
        success: false,
        error: "You must be logged in to create a subreddit.",
      });
    }

    const subreddit = await prisma.subreddit.create({
      data: {
        name,
        userId: req.user.id,
      },
    });
    res.send({
      success: true,
      subreddit,
    });
  } catch (error) {
    res.send({ success: false, error: error.message });
  }
});

subredditRouter.delete("/:subredditId", async (req, res) => {
  try {
    const userId = req.user.id;
    const { subredditId } = req.params;

    if (!req.user) {
      return res.send({
        success: false,
        error: "Please login to delete.",
      });
    }
    //Checks if Subreddit Exists
    const subreddit = await prisma.subreddit.findUnique({
      where: { id: subredditId },
    });

    if (!subreddit) {
      return res.send({ success: false, error: "Subreddit doesn't exist" });
    }

    if (userId !== subreddit.userId) {
      return res.send({
        success: false,
        error: "You must be the owner of this subreddit to delete!",
      });
    }

    const subreddits = await prisma.subreddit.delete({
      where: {
        id: subredditId,
      },
    });
    res.send({ success: true, subreddits });
  } catch (error) {
    return res.send({ success: false, error: error.message });
  }
});
