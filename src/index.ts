import dotenv from 'dotenv'
import express, { Application } from 'express'

dotenv.config({ path: '.env' })

import { submitRouter } from './routes/submit'

const app: Application = express()
app.use(express.json())
app.use('/submit', submitRouter);
app.listen(process.env.PORT || 3555, function () {
    console.log(`Server started on ${process.env.PORT}`)
});
