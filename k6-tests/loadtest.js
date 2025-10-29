import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 8 }, // ramp-up to 10 users
    { duration: '40s', target: 8 }, // stay at 10 users
    { duration: '20s', target: 0 }, // ramp-down to 0 users
  ], 
  
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests < 1s
    http_req_failed: ['rate<0.05'],    // failure rate < 5%
    checks: ['rate>0.95'],   // homepage success >95%
  },

};

export default function () {
  //test homepage
  let res1 = http.get('http://localhost:4567/');
  check(res1, {
    'status is 200': (r) => r.status === 200,
    'homepage loads fast': (r) => r.timings.duration < 500,
  })

  //test login page
  let res2 = http.get('http://localhost:4567/login');
  check(res2, {
    'status is 200': (r) => r.status === 200,
    'homepage loads fast': (r) => r.timings.duration < 500,
  })

  //test recent page
  let res3 = http.get('http://localhost:4567/recent');
  check(res3, {
    'status is 200': (r) => r.status === 200,
    'homepage loads fast': (r) => r.timings.duration < 500,
  })

  sleep(1);
  
};

  


