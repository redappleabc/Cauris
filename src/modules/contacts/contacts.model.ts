import mongoose from "mongoose";
const Schema = mongoose.Schema;

const schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  address: { type: String},
  username: {type: String},
});

schema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

export const ContactModel = mongoose.model("Contacts", schema);
