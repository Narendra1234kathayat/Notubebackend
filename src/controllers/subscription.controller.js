import mongoose, { isValidObjectId } from "mongoose";
import writeLog from "../Logger.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asynchandler } from "../utils/asynchandler.js";

// Toggle subscription
const toggleSubscription = asynchandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user?._id;
  writeLog("info", `Toggle subscription request received. Method: ${req.method}, URL: ${req.url}, User ID: ${userId}, Channel ID: ${channelId}`);

  if (!isValidObjectId(channelId)) {
    writeLog("warn", `Invalid channelId provided. User ID: ${userId}`);
    throw new ApiError(400, "Invalid channelId");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (existingSubscription) {
    await Subscription.findByIdAndDelete(existingSubscription._id);
    writeLog("info", `Subscription removed successfully. User ID: ${userId}`);
    return res.status(200).json(new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully"));
  }

  const newSubscription = await Subscription.create({
    subscriber: userId,
    channel: channelId,
  });

  writeLog("info", `Subscription created successfully. User ID: ${userId}`);
  return res.status(200).json(new ApiResponse(200, { subscribed: true }, "Subscribed successfully"));
});

// Get subscriber list of a channel
const getUserChannelSubscribers = asynchandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user?._id;
  writeLog("info", `Get channel subscribers request received. Method: ${req.method}, URL: ${req.url}, User ID: ${userId}, Channel ID: ${channelId}`);

  if (!isValidObjectId(channelId)) {
    writeLog("warn", `Invalid channelId provided. User ID: ${userId}`);
    throw new ApiError(401, "Incorrect channel Id");
  }

  try {
    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(channelId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscriber",
          pipeline: [
            {
              $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "issubscribed",
              },
            },
            {
              $addFields: {
                subscribedtosubscriber: {
                  $cond: {
                    if: {
                      $in: [
                        new mongoose.Types.ObjectId(channelId),
                        "$issubscribed.subscriber",
                      ],
                    },
                    then: true,
                    else: false,
                  },
                },
                subscribercount: {
                  $size: "$issubscribed",
                },
              },
            },
          ],
        },
      },
      {
        $unwind: "$subscriber",
      },
      {
        $project: {
          _id: 1,
          subscriber: {
            _id: 1,
            username: 1,
            fullname: 1,
            avatar: 1,
            issubscribed: 1,
            subscribedtosubscriber: 1,
            subscribercount: 1,
          },
        },
      },
    ]);

    if (!subscribers) {
      writeLog("warn", `Failed to fetch subscribers. User ID: ${userId}`);
      throw new ApiError(501, "Failed to fetch subscribers");
    }

    writeLog("info", `Subscribers fetched successfully. User ID: ${userId}`);
    return res.status(200).json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"));
  } catch (error) {
    writeLog("error", `Error fetching subscribers: ${error.message}. User ID: ${userId}`);
    return res.status(500).json(new ApiResponse(500, "Internal Server Error"));
  }
});

// Get channels the user has subscribed to
const getSubscribedChannels = asynchandler(async (req, res) => {
  const { subscriberId } = req.params;
  const userId = req.user?._id;
  writeLog("info", `Get subscribed channels request received. Method: ${req.method}, URL: ${req.url}, User ID: ${userId}, Subscriber ID: ${subscriberId}`);

  if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
    writeLog("warn", `Invalid subscriberId provided. User ID: ${userId}`);
    return res.status(400).json(new ApiError(400, "Invalid subscriber ID"));
  }

  try {
    const subscribedChannels = await Subscription.aggregate([
      {
        $match: {
          subscriber: new mongoose.Types.ObjectId(subscriberId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "subscribedChannel",
          pipeline: [
            {
              $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos",
              },
            },
            {
              $addFields: {
                latestVideo: {
                  $last: "$videos",
                },
              },
            },
            { $unwind: "$videos" }
          ],
        },
      },
      {
        $unwind: "$subscribedChannel",
      },
      {
        $project: {
          _id: 1,
          subscribedChannel: {
            _id: "$subscribedChannel._id",
            username: "$subscribedChannel.username",
            fullname: "$subscribedChannel.fullname",
            avatar: "$subscribedChannel.avatar",
            videos: {
              _id: "$subscribedChannel.videos._id",
              videoFile: "$subscribedChannel.videos.videoFile",
              thumbnail: "$subscribedChannel.videos.thumbnail",
              owner: "$subscribedChannel.videos.owner",
              title: "$subscribedChannel.videos.title",
              description: "$subscribedChannel.videos.description",
              duration: "$subscribedChannel.videos.duration",
              createdAt: "$subscribedChannel.videos.createdAt",
              views: "$subscribedChannel.videos.views",
            },
            latestVideo: "$subscribedChannel.latestVideo",
          },
        },
      },
    ]);

    writeLog("info", `Subscribed channels fetched successfully. User ID: ${userId}`);
    return res.status(200).json(new ApiResponse(200, subscribedChannels, "Successfully retrieved subscribed channels"));
  } catch (error) {
    writeLog("error", `Error fetching subscribed channels: ${error.message}. User ID: ${userId}`);
    return res.status(500).json(new ApiResponse(500, "Internal Server Error"));
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
