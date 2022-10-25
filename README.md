# Ares
Public API backend for the kratos23.com site. 
Made using Express.js, and MongoDB, with Typescript.
Contains simple endpoints for submitting user registration forms, and for associated proof of payment, along with a dumb viewcounter endpoint.

It was containerized and deployed on Google Cloud's Cloud Run service and handled the very light traffic of around 9000 view counts and 300+ form submissions over a week or two.

## Usage
The API main deployement has been decommissioned as of 26-Oct-2022. 

## Endpoints
All the request body and responses are JSON

- `/submit`
  - `/`
    | Method | Description | Req Body | Response | HTTP Code | 
    |--------|-------------|------|----------|-|
    | POST   | Submit a valid registration form | `Form` | Form ID, and payable amount | 200 |
  - `/payment`
    | Method | Description | Req Body | Response | HTTP Code | 
    |--------|-------------|------|----------|-|
    | POST   | Submit the proof of payment screenshot | Single form-data image, and form_id to associate the image with | HTTP 303 redirect to success page | 303 / 400 |
- `/retrieve`
  - `/`
    | Method | Description | Req Body | Response | HTTP Code | 
    |--------|-------------|------|----------|-|
    | GET    | Retrieve the list of all submitted forms | | Array of JSON objects | 200 |
    
- `/analytics`
  - `/view`
    | Method | Description | Req Body | Response | HTTP Code | 
    |--------|-------------|------|----------|-|
    | GET    | Log a site view |  |  | 200 |

## Deployement (basic)
The simplest way would be to clone the repo and running `docker build`, and `docker run`.

But you could also run the program as a bare node application by filling out the *`.env`* file, running `npm install`, 
and then running `npm run build`, followed by `npm run start`.

Either way, you'll need a running instance of MonngoDB and the URI to access it along with network access to the cluster or serverless instance.

## Previous Features
The backend used to contain payment gateway integrations, from Razorpay and then Google Pay at one point, but that was removed due to Indian regulatory 
difficulties. The code can still be found in the commit history.
