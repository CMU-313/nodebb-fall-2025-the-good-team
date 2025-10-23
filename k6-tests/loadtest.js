import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10, // virtual users
  duration: '20s',
};

export default function () {
  http.get('http://localhost:4567/'); // change port if your NodeBB runs elsewhere
  sleep(1);
}
