import axios from 'axios';
import cors from 'cors';
import * as dotenv from 'dotenv';
import express, { Application } from 'express';

dotenv.config()

import { submitRouter } from './routes/submit.js';

const app: Application = express()
app.use(express.json())
app.use(cors())
app.use('/submit', submitRouter);
app.listen(process.env.PORT || 3555, function () {
    console.log(`Server started on ${process.env.PORT || 3555}`)
});

export { };
