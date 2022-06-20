import { Observable, fromEvent } from 'rxjs';
import { map, pluck } from 'rxjs/operators';

const email = document.querySelector('.email');
const hello = document.querySelector('.hello');

const stream$ = fromEvent(email, 'input')
  .pipe(
    pluck('target', 'value')
  );

stream$.subscribe((value) => {
  hello.textContent = 'Привет, ' + ( value || 'Guest');
});
stream$.subscribe(((name, value) => {
  console.log('Input event in ' + name + ' value ' + value + ' time ' + performance.now());
}).bind(null, 'email'));
stream$.subscribe((value) => {
  fetch('http://localhost:7070/email/check/' + value);
});

const fetchStream$ = from(fetch('http://localhost:8080/'));

fetchStream$.subscribe((value) => {
  console.log(value);
});

const arrayStream$ = of(1, 2, 3)
  .pipe(
    map(x => x * 2),
    filter(x => x > 5),
    startWith(0)
  );

arrayStream$.subscribe((value) => {
  console.log(value);
});


