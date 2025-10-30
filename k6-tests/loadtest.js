import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 2 }, //slow ramp-up 
    { duration: '20s', target: 5 }, // ramp-up to 5 users
    { duration: '40s', target: 5 }, // stay at 5 users
    { duration: '20s', target: 0 }, // ramp-down to 0 users
  ], 
  
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests < 1s
    http_req_failed: ['rate<0.05'],    // failure rate < 5%
    checks: ['rate>0.95'],   // homepage success >95%
  },

};

const BASE_URL = 'http://localhost:4567';

export default function () {
  //test homepage
  let res1 = http.get(`${BASE_URL}/`);
  console.log('res1: ', res1.status);
  check(res1, {
    'home page status is 200': (r) => r.status === 200,
    'homepage loads fast': (r) => r.timings.duration < 500,
  })

  sleep(1);

  const apiRes = http.get(`${BASE_URL}/api/config`);
  check(apiRes, {
    'api/config status is 200': (r) => r.status === 200,
    'api/config loads fast': (r) => r.timings.duration < 700,
  });

};

  


