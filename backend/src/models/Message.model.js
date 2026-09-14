import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    imageSent: {
      type: String,
      default: "",
    },
    messageSent: {
      type: String,
      default: "",
    },
    videoSent: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const Message = mongoose.Model("Message", messageSchema);

export default Message;
