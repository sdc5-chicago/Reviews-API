import http from 'k6/http';
import {sleep} from 'k6';

// * Configuration
export let options = {
  // no certificate, so ignore
  insecureSkipTLSVerify: true,
  // this one is for the socket, not need to worry
  noConnectionReuse: false,
  stages: [
    {duration:'5m',target:100}, // simulate ramp-up of traffic from 1 to 100 users over 5 minutes
    {duration:'10m',target:100},// stay at 100 users for 10 m
    {duration:'5m',target:0},   // ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(99)<150'], // 99% of requests must complete below 150ms.
  }
};

const URL = 'http://3.129.29.37:5000';


export default () => {

  http.batch([
    ['GET', `${URL}/reviews/420/meta`],
    ['GET', `${URL}/reviews/420`],
    ['POST', `${URL}/reviews/report/420`],
    ['POST', `${URL}/reviews/420/helpful`],
    // ['POST', `${URL}/reviews/420`],
  ])

  sleep(1);
}
