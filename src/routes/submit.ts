import { Router } from 'express'
import { DBClient } from '../database.js'
import axios from 'axios';

export const submitRouter = Router()
const dbCon = new DBClient()
const forms = dbCon.getDb().collection('forms')

// setup fee details
const eventCount = (await axios.get<Number>('https://kratos23.com/public/events/count')).data

let eventFees: Map<string, number> = new Map();
const toCodeName = (x: any) => (x.toLowerCase().replace(' ', '_') as string)
for (let i = 0; i < eventCount; i++) {
  let event = (await axios.get(`https://kratos23.com/public/events/event${i}.json`)).data
  let codeName = toCodeName(event.content.name)
  eventFees.set(codeName, event.content.fee)
}
console.log('fetched event fees: ', eventFees)

submitRouter.route('/')
  .post(async function (req, res) {
    const form = req.body;
    console.log('Recieved form:', form)

    // TODO: do form validation (typeguard shit)

    let chosenEventCodes: Array<string> = form.solo_events.map((x: string) => toCodeName(x))
    // Team events is a array of code_name strings, assured as of 16.Sep.22 in the kratos front-end code.
    chosenEventCodes = chosenEventCodes.concat(form.team_events)
    // #get() not returning undefined is guaranteed by the type guard. Only valid events can be present in form.
    const totalFee = chosenEventCodes.map((x) => eventFees.get(x)).reduce((a, x) => a! + x!)
    console.log('total fee', totalFee)

    let status = await forms.insertOne(form)
    console.log('insert result: ', status)



    res.sendStatus(200);
  })

