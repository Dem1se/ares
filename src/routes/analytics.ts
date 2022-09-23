import { Router } from 'express';

export const submitRouter = Router()

submitRouter.route('/visit')
    .get(async function (req, res, next) {
        console.log('recieved visit');
        res.sendStatus(200);
    })


