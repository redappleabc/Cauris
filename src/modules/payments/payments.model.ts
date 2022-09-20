import { EPayPlatform } from "@servichain/enums/EPayPlatform";
import { ETransferState } from "@servichain/enums/ETransferState";
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const PaySchema = new Schema({
  user: {type: Schema.Types.ObjectId, required: true, ref: 'User'},
  amount: {type: Number, required: true},
  currency: {type: Number, required: true},
  description: String,
  paymentType: String,
  coins: [
    {
      id: String,
      amount: String
    }
  ],
  state: {type: Number, enum: ETransferState, default: ETransferState.ordered},
  paymentPlatform: {type: String, enum: EPayPlatform, default: null},
  createdAt: {type: Date, default: Date.now()}
})

PaySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id
  }
})

export const PayModel = mongoose.model("Payment", PaySchema);
