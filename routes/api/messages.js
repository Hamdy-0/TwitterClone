const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");

const User = require("../../schemas/UserSchema");
const Post = require("../../schemas/PostSchema");
const Chat = require("../../schemas/ChatSchema");
const Message = require("../../schemas/MessageSchema");
const Notification = require("../../schemas/NotificationSchema");

app.use(bodyParser.urlencoded({ extended: false }));

// router.post("/", async (req, res, next) => {
//   if (!req.body.content || !req.body.chatId) {
//     console.log("Invalid data passed into request");
//     return res.sendStatus(400);
//   }

//   let newMessage = {
//     sender: req.session.user._id,
//     content: req.body.content,
//     chat: req.body.chatId,
//   };
//   Message.create(newMessage)
//     .then(async (message) => {
//       message = await message.populate("sender");
//       message = await message.populate("chat");
//       message = await User.populate(message, { path: "chat.users" });
//       let chat = await Chat.findByIdAndUpdate(req.body.chatId, {
//         latestMessage: message,
//       }).catch((err) => {
//         console.log(err);
//       });
//       insertNotifications(chat, message);
//       res.status(201).send(message);
//     })
//     .catch((err) => {
//       console.log(err);
//       res.sendStatus(400);
//     });
// });

router.post("/", async (req, res, next) => {
  if (!req.body.content || !req.body.chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  let newMessage = {
    sender: req.session.user._id,
    content: req.body.content,
    chat: req.body.chatId,
  };

  try {
    let message = await Message.create(newMessage);

    // Populate sender and chat fields
    message = await message.populate("sender");
    message = await message.populate("chat");

    // Populate chat.users field
    message = await User.populate(message, { path: "chat.users" });

    // Update the chat's latestMessage field
    let chat = await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });

    // Insert notifications for other users in the chat
    insertNotifications(chat, message);

    // Send the message back to the client
    res.status(201).send(message);
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
});
// function insertNotifications(chat, message) {
//   chat.users.forEach((userId) => {
//     if (userId == message.sender._id.toString()) return;

//     Notification.insertNotification(
//       userId,
//       message.sender._id,
//       "newMessage",
//       message.chat._id
//     ).catch((error) => {
//       console.log("Error inserting notification:", error);
//     });
//   });
// }
function insertNotifications(chat, message) {
  chat.users.forEach((userId) => {
    if (userId.toString() === message.sender._id.toString()) return;

    Notification.insertNotification(
      userId,
      message.sender._id,
      "newMessage",
      message.chat._id
    ).catch((error) => {
      console.log("Error inserting notification:", error);
    });
  });
}
module.exports = router;
