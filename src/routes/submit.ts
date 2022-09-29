import axios from 'axios';
import { Router } from 'express';
import { DBClient } from '../database.js';
import { toCodeName } from '../typeguards.js';
import { validateAndNormalizeForm } from '../typeguards.js';

export const submitRouter = Router()
const dbCon = new DBClient()
const forms = dbCon.getDb().collection('forms')
const payments = dbCon.getDb().collection('payments')
const falsePayments = dbCon.getDb().collection('false_payments')

// setup fee details
const eventCount = (await axios.get<Number>('https://storage.googleapis.com/kratos23.com/events/count')).data

let eventFees: Map<string, number> = new Map();

for (let i = 0; i < eventCount; i++) {
  let event = (await axios.get(`https://storage.googleapis.com/kratos23.com/events/event${i}.json`)).data
  let codeName = toCodeName(event.content.name)
  eventFees.set(codeName, event.content.fee)
}
console.log('Fetched event fees: ', eventFees)

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

    res.status(200).send({
      form_id: dbRes.insertedId,
      amount: totalFee,
    });
  })

// submitRouter.route('/verify')
//   .post(async function (req, res, next) {
//     res.sendStatus(200) //
//   })
