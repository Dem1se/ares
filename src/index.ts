import cors from 'cors';
import * as dotenv from 'dotenv';
import express, { Application } from 'express';

dotenv.config()

import { submitRouter } from './routes/submit.js';
import { analyticsRouter } from './routes/analytics.js';
import { retrieveRouter } from './routes/retrieve.js';

const app: Application = express()
app.use(cors())
app.options('*', cors())
app.use(express.json())
app.use('/submit', submitRouter);
app.use('/analytics', analyticsRouter);
app.use('/retrieve', retrieveRouter);
app.listen(process.env.PORT || 3555, function () {
    console.log(`Server started on ${process.env.PORT || 3555}`)
});

export { };
