import { Router } from 'express';

export const analyticsRouter = Router()

analyticsRouter.route('/views')
    .get(async function (req, res, next) {
        console.log('recieved visit');
        res.sendStatus(200);
    })


