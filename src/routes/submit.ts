import crypto from 'crypto'
import { Router } from 'express'
import { DBClient } from '../database.js'
import axios from 'axios';
import razorpay from 'razorpay';
import { ObjectId } from 'mongodb';

export const submitRouter = Router()
const dbCon = new DBClient()
const forms = dbCon.getDb().collection('forms')
const payments = dbCon.getDb().collection('payments')
const falsePayments = dbCon.getDb().collection('false_payments')
const rzp = new razorpay({
  key_id: process.env.RZP_KEY_ID,
  key_secret: process.env.RZP_KEY_SECRET
})

// setup fee details
const eventCount = (await axios.get<Number>('https://kratos23.com/public/events/count')).data

let eventFees: Map<string, number> = new Map();
const toCodeName = (x: any) => (x.toLowerCase().replaceAll(' ', '_') as string)
for (let i = 0; i < eventCount; i++) {
  let event = (await axios.get(`https://kratos23.com/public/events/event${i}.json`)).data
  let codeName = toCodeName(event.content.name)
  eventFees.set(codeName, event.content.fee)
}
console.log('Fetched event fees: ', eventFees)

submitRouter.route('/')
  .post(async function (req, res, next) {
    const form = req.body;
    console.log('Recieved form:', form)

    // TODO: do form validation (typeguard shit)

    let chosenEventCodes: Array<string> = form.solo_events.map((x: string) => toCodeName(x))
    // Team events is a array of code_name strings, assured as of 16.Sep.22 in the kratos front-end code.
    chosenEventCodes = chosenEventCodes.concat(form.team_events)
    // #get() not returning undefined is guaranteed by the type guard. Only valid events can be present in form.
    const totalFee: number = chosenEventCodes.map((x) => eventFees.get(x)).reduce((a, x) => a! + x!)!
    console.log('total fee', totalFee)

    let dbRes = await forms.insertOne(form)
    console.log('insert result: ', dbRes)

    let rzpOrder = await rzp.orders.create({
      amount: totalFee * 100,
      currency: "INR",
      notes: {
        "objID": `${dbRes.insertedId}`
      }
    })

    // add the rzp order_id to the original form
    await forms.updateOne({ _id: dbRes.insertedId }, { $set: { order_id: rzpOrder.id } })

    // redundant check for consistency in value.
    // wont happen
    if (totalFee * 100 !== rzpOrder.amount) {
      console.error(`Locally computed totalAmount and razorPay returned order entity's amount are not equal!`);
      res.sendStatus(500)
      next()
    }

    res.status(200).send({
      form_id: dbRes.insertedId,
      amount: totalFee * 100,
      order_id: rzpOrder.id,
      key: process.env.RZP_KEY_ID,
    });
  })

submitRouter.route('/verify')
  .post(async function (req, res, next) {
    // env file loading / validity has been ensured by db module at least partially,
    // still checking for relevant vars
    if (!process.env.RZP_KEY_SECRET) {
      console.error('.env Error: RZP_KEY_SECRET not defined. Exiting...');
      process.exit(2);
    }

    console.log('Recieved verify request for: ', req.body)

    // console.log('Given form id: ', req.body.form_id)
    let givenOrderID: number = req.body.razorpay_order_id;


    // Make sure the order_id is valid on razorpay's side
    let givenRzpOrder = await rzp.orders.fetch(req.body.razorpay_order_id)
    console.log('Given (fetched) rzp order: ', givenRzpOrder)
    if (!givenRzpOrder) {
      console.log('Non-existent order_id in request')
      res.status(400).json({ status: 'rejected', message: 'Invalid razorpay_order_id' })
    } else {

      // Make sure we still have the form associated with the rzp order
      let objID = givenRzpOrder.notes['objID'];
      console.log('rzp order\'s notes.objID: ', objID)
      let form = await forms.findOne({ _id: new ObjectId(`${objID}`) })
      if (!form) {
        console.log(`Form for the given verify order_id\'s corresponding (fetched) razorpay_order\'s objID(notes) does not exists? How did we end up here. We\'ve lost a form.`)
      } else {
        console.log('Found razorpay order\'s related form found successfully')
      }
    }

    // Make sure the given order_id and order_ID from fetched order derived from the given order_id have the same value
    // the is just a pointless cirular derivation lol, you're just comparing the same values ultimately, assuming the value 
    // exists on razorpay's side
    let objID = givenRzpOrder.notes['objID'];
    let expectedOrderID: number = (await forms.findOne({ _id: new ObjectId(`${objID}`) }))?.order_id
    console.log('expected order id: ', expectedOrderID)
    console.log('Given order ID: ', givenOrderID)
    if (expectedOrderID !== givenOrderID) {
      if (typeof expectedOrderID === null) {
        console.log('Invalid form_id submitted in req')
      } else {
        console.log('order_id for given form_id is incorrect.')
      }
      next()
    }
    let sigPayload: string = expectedOrderID + '|' + req.body.razorpay_payment_id;
    let recievedSig = req.body.razorpay_signature
    let expectedSig = crypto.createHmac('sha256', process.env.RZP_KEY_SECRET!)
      .update(sigPayload)
      .digest('hex')



    if (expectedSig === recievedSig) {
      let payment = await rzp.payments.fetch(req.body.razorpay_payment_id)
      if (['authorized', 'captured'].includes(payment.status)) {
        console.log('Payment successfully verified [signature, status]')
        payments.insertOne(req.body)
        res.status(200).json({ "paymentVerified": true })
      }
    } else {
      console.log('Payment\s signature verification failed')
      falsePayments.insertOne(req.body)
      res.status(402).json({ "paymentVerified": false })
    }
  })
