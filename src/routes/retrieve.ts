import { Router } from 'express';
import { DBClient } from '../database.js';

const dbCon = new DBClient()
const forms = dbCon.getDb().collection('forms')

export const retrieveRouter = Router()
retrieveRouter.route('/')
    .get(async function (req, res, next) {
        let list = await forms.find().toArray()
        res.json(list);
    })
