import mongoose from 'mongoose'

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING)
        console.log("Kết nối db thành công")
    } catch (error) {
        console.log("Lỗi kết nối db: ", error)
        process.exit(1)
    }
}