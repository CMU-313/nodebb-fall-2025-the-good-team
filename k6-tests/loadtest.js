import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10, // number of virtual users
  duration: '30s', // test duration
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests < 1s
    http_req_failed: ['rate<0.05'],    // failure rate < 5%
    checks: ['rate>0.95'],   // homepage success >95%
  },

};

const BASE_URL = 'http://localhost:4567';

export default function () {
  //test homepage
  const res = http.get('{BASE_URL}/');
  console.log('res1: ', res.status);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'homepage loads fast': (r) => r.timings.duration < 500,
  })

  //test api 
  let apiRes = http.get('{BASE_URL}/api/config');
  console.log ('api rest: ',apiRes.status);
  check(apiRes, {
    'status is 200': (r) => r.status === 200,
    'login page loads fast': (r) => r.timings.duration < 500,
  })

  sleep(1);

};

  


