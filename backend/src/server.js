import express from 'express'
import dotenv from 'dotenv'
import { connectDB } from './libs/db.js';
import authRoute from './routes/authRoute.js'
import cookieParser from 'cookie-parser'
import userRoute from './routes/userRoute.js'
import { protectRoute } from './middlewares/authMiddleware.js';

dotenv.config()

const app = express();
const PORT = process.env.PORT || 5001

// middleware
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));

//public routes
app.use('/api/auth', authRoute)

//private routes
app.use(protectRoute)
app.use('/api/users', userRoute)

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`)
    })
})

