import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    refreshToken: {
        type: String,
        required: true,
        unique: true
    },
    expriresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
})

sessionSchema.index({ expriresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model("Session", sessionSchema)