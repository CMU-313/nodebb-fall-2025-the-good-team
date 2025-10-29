import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
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

export default function () {
  //test homepage
  let res1 = http.get('http://localhost:4567/');
  System.out.println('res1: ', res1.status);
  check(res1, {
    'status is 200': (r) => r.status === 200,
    'homepage loads fast': (r) => r.timings.duration < 500,
  })

  //test login page
  let res2 = http.get('http://localhost:4567/login');
  System.out.println('res2: ',res2.status);
  check(res2, {
    'status is 200': (r) => r.status === 200,
    'login page loads fast': (r) => r.timings.duration < 500,
  })

  //test recent page
  let res3 = http.get('http://localhost:4567/recent');
  System.out.println('res3: ',res3.status);
  check(res3, {
    'status is 200': (r) => r.status === 200,
    'recents loads fast': (r) => r.timings.duration < 500,
  })

  sleep(1);

};

  


