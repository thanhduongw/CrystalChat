import bcrypt from 'bcrypt'
import User from '../models/User.js';
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import Session from '../models/Session.js';

const ACCESS_TOKEN_TTL = '30m'
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000

export const signUp = async (req, res) => {
    try {
        //validate dữ liệu đầu vào
        const { username, password, email, firstName, lastName } = req.body;

        if (!username || !password || !email || !firstName || !lastName) {
            return res
                .status(400)
                .json({ message: "Không thể thiếu username, pasword, email, firstName, lastName" })
        }

        //kiểm tra username có tồn tại chưa
        const duplicate = await User.findOne({ username })
        if (duplicate) {
            return res.status(409).json({ message: "username đã tồn tại" })
        }

        // mã hóa password
        const hashedPassword = await bcrypt.hash(password, 10)

        // tạo user mới
        await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${firstName} ${lastName}`
        })

        // return
        return res.sendStatus(204)

    } catch (error) {
        console.error("Lỗi khi gọi SignUp", error)
        return res.status(500).json({ message: "Lỗi hệ thông" })
    }
}

export const signIn = async (req, res) => {
    try {
        // lấy inputs
        const { username, password } = req.body
        if (!username || !password) {
            return res.status(400).json({ message: "Thiếu username hoặc pasword" })
        }

        //lấy hashPassword trong db so với password input
        const user = await User.findOne({ username })
        if (!user) {
            return res.status(401).json({ message: "username hoặc password không đúng" })
        }

        // kiểm tra password
        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword)
        if (!passwordCorrect) {
            return res.
                status(401)
                .json({ message: "username hoặc password không đúng" })
        }

        // nếu khớp, tạo accessToken với jwt
        const accessToken = jwt.sign(
            { userId: user._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_TOKEN_TTL }
        )

        //tạo refreshToken
        const refreshToken = crypto.randomBytes(64).toString('hex');

        // tạo session mới để lưu refreshToken
        await Session.create({
            userId: user._id,
            refreshToken,
            expriresAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
        })

        // trả refreshToken về trong cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: REFRESH_TOKEN_TTL
        })

        // trả access token về trong res
        return res.status(200).json({ message: `User: ${user.displayName}`, accessToken })

    } catch (error) {
        console.error("Lỗi khi gọi SignIn", error)
        return res.status(500).json({ message: "Lỗi hệ thông" })
    }
}

export const signOut = async (req, res) => {
    try {
        // lấy refreshToken từ cookie
        const token = req.cookies?.refreshToken
        if (!token) {
            // Xóa refreshToken trong Session
            await Session.deleteOne({ refreshToken: token })

            // Xóa cookie
            res.clearCookie("refreshToken")
        }

        return res.sendStatus(204)

    } catch (error) {
        console.error("Lỗi khi gọi SignOut", error)
        return res.status(500).json({ message: "Lỗi hệ thông" })
    }
}

export const refreshToken = async (req, res) => {
    try {
        // lấy refresh token từ cookie
        const token = req.cookies?.refreshToken
        if (!token) {
            return res.status(401).json({ message: "RefreshToken không tồn tại" })
        }

        // so sánh token
        const session = await Session.findOne({ refreshToken: token })
        if (!session) {
            return res.status(403).json({ message: "Token không hợp lệ hoặc hết hạn" })
        }

        // kiểm tra hết hạn chưa
        if (session.expriresAt < new Date()) {
            return res.status(403).json({ message: "Token hết hạn" })
        }

        // tạo access token mới
        const accessToken = jwt.sign({ userId: session.userId }, process.env.ACCESS_TOKEN_SECRET, { expriresAt: ACCESS_TOKEN_TTL })

        //return
        return res.status(200).json({ accessToken })

    } catch (error) {
        console.error("Lỗi khi gọi refreshToken", error)
        return res.status(500).json({ message: "Lỗi hệ thông" })
    }
}