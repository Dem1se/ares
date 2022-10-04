import { DBClient } from '../database.js';
import { Router } from 'express';

export const analyticsRouter = Router()
const dbCon = new DBClient()
const analy = dbCon.getDb().collection('analytics')

analyticsRouter.route('/views')
    .all(function (req, res, next) {
        res.setHeader('cache-control', 'no-store')
        next()
    })
    .get(async function (req, res, next) {
        analy.insertOne({
            "metadata": {
                "type": "view",
                "url": "/"
            },
            "timestamp": new Date()
        })
        res.sendStatus(200);
    })


