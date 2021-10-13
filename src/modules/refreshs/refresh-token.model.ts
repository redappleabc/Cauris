import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true},
    token: {type: String, required: true},
    expires: {type: Date, required: true},
    created: { type: Date, default: Date.now },
    createdByIp: String,
    revoked: Date,
    revokedByIp: String,
    replacedByToken: String
});

schema.virtual('isExpired').get(function () {
    return Date.now() >= this.expires;
});

schema.virtual('isActive').get(function () {
    return !this.revoked && !this.isExpired;
});

schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc: any, ret: any) {
        delete ret._id;
        delete ret.id;
        delete ret.user;
    }
});

export default mongoose.model('RefreshToken', schema);