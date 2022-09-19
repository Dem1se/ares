import axios from 'axios'

let eventCodes: Array<string> = [];
const eventCount = (await axios.get<Number>('https://kratos23.com/public/events/count')).data
export const toCodeName = (x: any) => (x.toLowerCase().replaceAll('-', ' ').replaceAll('\'', '').replaceAll(' ', '_') as string)
for (let i = 0; i < eventCount; i++) {
    let event = (await axios.get(`https://kratos23.com/public/events/event${i}.json`)).data
    let codeName = toCodeName(event.content.name)
    eventCodes.push(codeName);
}

interface SubForm {
    full_name: string;
    college_name: string;
    email: string;
    mobile: string;
}

interface TeamEventSubForm extends SubForm {
    member1_full_name: string;
    member2_full_name: string;
    member3_full_name: string;
}

export interface Form extends SubForm {
    solo_events: Array<string>;
    team_events: Array<string>;

    alls_fair_in_tug_of_war?: TeamEventSubForm;
    channel_surfing?: TeamEventSubForm;
    cine_quiz?: TeamEventSubForm;
    code_play?: TeamEventSubForm;
    debugging?: TeamEventSubForm;
    futsal?: TeamEventSubForm;
    gaming_fifa?: TeamEventSubForm;
    gaming_valorant?: TeamEventSubForm;
    murder_mystery?: TeamEventSubForm;
    pair_programming?: TeamEventSubForm;
    paper_presentation?: TeamEventSubForm;
    shipwreck?: TeamEventSubForm;
}

export function validateAndNormalizeForm(form: any) {
    let isValid = true;

    // isValid = isValid ? form.hasOwn('full_name') : isValid
    // isValid = isValid ? form.has('college_name') : isValid
    // isValid = isValid ? form.has('email') : isValid
    // isValid = isValid ? form.has('mobile') : isValid
    // isValid = isValid ? form.has('solo_events') : isValid
    // isValid = isValid ? form.has('team_events') : isValid
    isValid = isValid && form.hasOwnProperty('full_name')
    isValid = isValid && form.hasOwnProperty('college_name')
    isValid = isValid && form.hasOwnProperty('email')
    isValid = isValid && form.hasOwnProperty('mobile')
    isValid = isValid && form.hasOwnProperty('solo_events')
    isValid = isValid && form.hasOwnProperty('team_events')

    if (!isValid) {
        return false
    }


    // isValid = isValid ? form.get('solo_events').every((x: string) => form.has(x)) : isValid

    for (let ev of form['team_events']) {
        isValid = isValid && form.hasOwnProperty(ev)
        isValid = isValid && form[ev].hasOwnProperty('full_name')
        isValid = isValid && form[ev].hasOwnProperty('college_name')
        isValid = isValid && form[ev].hasOwnProperty('email')
        isValid = isValid && form[ev].hasOwnProperty('mobile')
        isValid = isValid && form[ev].hasOwnProperty('member1_full_name')
        isValid = isValid && form[ev].hasOwnProperty('member2_full_name')
        isValid = isValid && form[ev].hasOwnProperty('member3_full_name')
    }

    if (!isValid) {
        return false
    }

    // for (let ev of form.get('solo_events').concat(form.get('team_events'))) {
    //     isValid = isValid ? form.has(ev) : isValid
    //     isValid = isValid ? form.get(ev)?.has('full_name') : isValid
    //     isValid = isValid ? form.get(ev)?.has('college_name') : isValid
    //     isValid = isValid ? form.get(ev)?.has('email') : isValid
    //     isValid = isValid ? form.get(ev)?.has('mobile') : isValid
    //     isValid = isValid ? form.get(ev)?.has('member1_full_name') : isValid
    //     isValid = isValid ? form.get(ev)?.has('member2_full_name') : isValid
    //     isValid = isValid ? form.get(ev)?.has('member3_full_name') : isValid
    // }

    // Trim the basic mandatory fields
    form.full_name = form.full_name.trim()
    form.college_name = form.college_name.trim()
    form.email = form.email.trim()
    form.mobile = form.mobile.trim()
    form.solo_events = form.solo_events.filter((x: string) => x !== "")
    form.team_events = form.team_events.filter((x: string) => x !== "")
    // form.set('full_name', form.get('full_name').trim())
    // form.set('college_name', form.get('college_name').trim())
    // form.set('email', form.get('email').trim())
    // form.set('mobile', form.get('mobile').trim())
    // form.set('solo_events', form.get('solo_events').filter((x: string) => x !== ""))
    // form.set('team_events', form.get('team_events').filter((x: string) => x !== ""))

    // Mandatory single name + optional additional names + spaces + special characters (' . -)
    let name = /^[A-Za-z]+((\s)?(('|-|\.)?([A-Za-z])+))*\s*?$/
    isValid = isValid && name.test(form.full_name)
    isValid = isValid && name.test(form.college_name)
    // isValid = isValid ? name.test(form.get('full_name')) : isValid
    // isValid = isValid ? name.test(form.get('college_name')) : isValid
    if (!isValid) {
        return false
    }

    let email = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/
    isValid = isValid && email.test(form['email'])
    // isValid = isValid ? email.test(form.get('email')) : isValid
    if (!isValid) {
        return false
    }

    let mobile = /^[0-9]{10}$/
    isValid = isValid && mobile.test(form['mobile'])
    // isValid = isValid ? mobile.test(form.get('mobile')) : isValid
    if (!isValid) {
        return false
    }

    isValid = isValid && form.solo_events.every((x: string) => eventCodes.includes(x))
    isValid = isValid && form.team_events.every((x: string) => eventCodes.includes(x))
    if (!isValid) {
        return false
    }
    // isValid = isValid ? form.get('solo_events').every((x: string) => eventCodes.includes(x)) : isValid
    // isValid = isValid ? form.get('team_events').every((x: string) => eventCodes.includes(x)) : isValid
    return isValid;
}