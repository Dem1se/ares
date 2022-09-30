import { Storage } from '@google-cloud/storage';
import axios from 'axios';
import { Router } from 'express';
import multer from 'multer';
import { DBClient } from '../database.js';
import { toCodeName, validateAndNormalizeForm } from '../typeguards.js';

const dbCon = new DBClient()

const forms = dbCon.getDb().collection('forms')
const payments = dbCon.getDb().collection('payments')
const falsePayments = dbCon.getDb().collection('false_payments')

// const gcs = new Storage({ keyFilename: './gcs-key.json' })
const gcs = new Storage({
  projectId: 'ares-22',
  credentials: {
    client_email: process.env.GCS_CL_EMAIL,
    private_key: process.env.GCS_PK
  }
})
const bucket = gcs.bucket('ares-22-screenshots')

const store = multer.memoryStorage()
const mult = multer({
  storage: store,
  // dest: 'uploads/', // debug statement
  fileFilter: function (req, file, cb) {
    cb(null, true) // TODO check for file format
  },
  limits: { fileSize: 5000000 } // 5MB
})

// setup fee details
const eventCount = (await axios.get<Number>('https://storage.googleapis.com/kratos23.com/events/count')).data

let eventFees: Map<string, number> = new Map();

for (let i = 0; i < eventCount; i++) {
  let event = (await axios.get(`https://storage.googleapis.com/kratos23.com/events/event${i}.json`)).data
  let codeName = toCodeName(event.content.name)
  eventFees.set(codeName, event.content.fee)
}
console.log('Fetched event fees: ', eventFees)

export const submitRouter = Router()
submitRouter.route('/')
  .post(async function (req, res, next) {
    const form = req.body;
    console.log('Recieved form:', form)

    if (!validateAndNormalizeForm(form)) {
      console.log("Recieved form is invalid");
      res.sendStatus(400)
      return
    }

    console.log('Recieved form is valid')
    let chosenEventCodes: Array<string> = form.solo_events.map((x: string) => toCodeName(x))
    // Team events is a array of code_name strings, assured as of 16.Sep.22 in the kratos front-end code.
    chosenEventCodes = chosenEventCodes.concat(form.team_events)
    // #get() not returning undefined is guaranteed by the type guard. Only valid events can be present in form.
    const totalFee: number = chosenEventCodes.map((x) => eventFees.get(x)).reduce((a, x) => a! + x!)!
    console.log('Total fee', totalFee)

    let dbRes = await forms.insertOne(form)
    console.log('Insert result: ', dbRes)

    // add the rzp order_id to the original form
    // await forms.updateOne({ _id: dbRes.insertedId }, { $set: { order_id: rzpOrder.id } })
    let r = {
      form_id: dbRes.insertedId,
      amount: totalFee,
    }
    console.log(r)
    res.status(200).send(r);
  })

submitRouter.route('/payment')
  .post(mult.single('screenshot'), async function (req, res, next) {
    // console.log('payment POST: ', req)
    if (!req.file) {
      res.sendStatus(400);
      next();
    }

    let fileName = `${req.body.form_id}-screenshot-${req.file!.originalname}`;
    let file = bucket.file(fileName)
    file
      .save(req.file!.buffer)
      .catch((err) => {
        console.log("Error uploading file")
        console.log(err)
      });

    const update = {
      $set: {
        screenshot: file.publicUrl()
      }
    }

    const dbRes = await forms.updateOne({ _id: req.body.form_id }, update);
    if (dbRes.acknowledged)
      res.redirect(303, `https://kratos23.com/success?&fid=${req.body.form_id}`);
    else
      res.status(400).send('Error attempting to update database');
  })
