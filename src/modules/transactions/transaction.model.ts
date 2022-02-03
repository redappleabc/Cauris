import mongoose from "mongoose";
const Schema = mongoose.Schema;

const schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  coin: { type: Schema.Types.ObjectId, ref: "Coin", required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  value: { type: String, required: true },
  hash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now() },
});

schema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.user;
  },
});

export const TransactionModel = mongoose.model("Transaction", schema);
