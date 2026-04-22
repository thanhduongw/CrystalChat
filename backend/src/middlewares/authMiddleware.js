import jwt from 'jsonwebtoken'
import User from '../models/User.js'

//authorization - xác minh user
export const protectRoute = (req, res, next) => {
    try {
        // lấy token từ header
        const authHeader = req.headers['authorization']

        const token = authHeader && authHeader.split(" ")[1]

        if (!token) {
            return res.status(401).json({ message: "Không tìm thấy accessToken" })
        }

        // xác minh token
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
            if (err) {
                console.log(err)

                return res.status(403).json({ message: "Access token hết hạn hoặc không đúng" })
            }

            //tìm user 
            const user = await User.findById(decodedUser.userId).select('-hashedPassword')

            if (!user) {
                return res.status(404).json({ message: "Người dùng không tồn tại" })
            }

            //trả user về trong req
            req.user = user;
            next();
        })
    } catch (error) {
        console.log("Lỗi khi xác minh JWT trong authMiddleware")
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}