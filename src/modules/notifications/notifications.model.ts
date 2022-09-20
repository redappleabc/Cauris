import mongoose from "mongoose";
const Schema = mongoose.Schema;

const schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  data: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now() },
});

schema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

export const NotificationModel = mongoose.model("CinetPayment", schema);
