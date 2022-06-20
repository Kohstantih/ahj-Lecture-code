import { Observable, Subject, fromEvent, from, of, range } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, pluck } from 'rxjs/operators';

const email = document.querySelector('.email');
const hello = document.querySelector('.hello');

function getRequest(url) {
  return new Observable((observer) => {
    const controller = new AbortController();

    fetch(url, {
      signal: controller.signal,
    })
      .then(res => res.json())
      .then((data) => {
        observer.next(data);
        observer.complete();
      })
      .catch(err => observer.error(err));

    return () => controller.abort();
  }
}

const stream$ = fromEvent(email, 'input')
  .pipe(
    debounceTime(300),
    pluck('target', 'value'),
    map(value => value.trim()),
    filter(Boolean),
    distinctUntilChanged(),
    switchMap(value => {
      return getRequest('http://localhost:7070/api/check-email/?email=', value)
        .pipe(
          catchError(err => {
            console.log(err);
          
            return of({ available: false });
          }),
        )
    }),
    map(value => value.available)
  );

const checkSubject$ = new Subject();

checkSubject$.subscribe((value) => {
  console.log(value);
});

setTimeout(() => {
  console.log('2nd subscription');
  checkSubject$.subscribe((value) => {
    console.log(value);
  });
}, 10000);

stream$.subscribe(checkSubject$);

// const fetchStream$ = from(fetch('http://localhost:8080/'));

// fetchStream$.subscribe((value) => {
//   console.log(value);
// });

// const arrayStream$ = range(1, 10)
//   .pipe(
//     map(x => x * 2),
//     filter(x => x > 5),
//     startWith(0)
//   );

// arrayStream$.subscribe((value) => {
//   console.log(value);
// });

from([1, 2, 3, 4])
  .pipe(
    exhaustMap(value => {
      return getRequest('http://localhost:7070/api/check-email/?email=', value)
        .pipe(
          catchError(err => {
            console.log(err);
          
            return of({ available: false });
          }),
        )
    }),
  ).subscribe(console.log)
  
const draggable = (el) => {
  const startDrag$ = fromEvent(el, 'mousedown');
  const moveDrag$ = fromEvent(document, 'mousemove');
  const endDrag$ = fromEvent(el, 'mouseup');
  
  return startDrag$.pipe(
    switchMap((event) => {
      event.stopPropagation();
      const diffX = el.offsetLeft - event.clientX;
      const diffY = el.offsetTop - event.clientY;
      return moveDrag$.pipe(
        map((event) => {
          const { clientX, clientY } = event;
          return {
            x: clientX + diffX,
            y: clientY + diffY,
          };
        }),
        takeUntil(endDrag$),
      );
    })
  );
};

draggable(email).subscribe(coord => {
  email.style.top = `${coord.y}px`;
  email.style.left = `${coord.x}px`;
});

const ACTIONS = {
  Increment: 'INCREMENT',
  Decrement: 'DECREMENT',
  Reset: 'RESET',
}

/**
 * {
 *  type: ACTIONS.Increment
 *  payload: 5
 * }
*/

function reduce(state, action) {
  switch (action.type) {
    case ACTIONS.Reset:
      return { ...state, counter: 0 };
    case ACTIONS.Increment:
      return {
        ...state,
        counter: state.counter + (action.payload || 1)
      };
    case ACTIONS.Decrement:
      return {
        ...state,
        counter: state.counter - (action.payload || 1)
      };
    default:
      return state;
  }
}

class Store {
  constructor() {
    this.actions$ = new Subject();
    this.state$ = this.actions$.asObservable().pipe(
      startWith({ type: ' INITIALIZATION ' }),
      scan((state, action) => reduce(state, action), { counter: 0 }),
      share()
    );
  }
  
  dispatch(type, payload = null) {
    this.actions$.next({ type, payload });
  }
  
  inc(value = null) {
    this.dispatch(ACTIONS.Increment, value);
  }
  dec(value = null) {
    this.dispatch(ACTIONS.Decrement, value);
  }
  reset(value = null) {
    this.dispatch(ACTIONS.Reset);
  }
}

const store = new Store();

const incButton = document.querySelector('.increment');
const decButton = document.querySelector('.decrement');

incButton.addEventListener('click', () => {
  store.inc();
});

decButton.addEventListener('click', () => {
  store.dec();
});

store.state$
  .pipe(
    pluck('counter'),
    distinctUntilChanged()
  ).subscribe(function(value) {
    const counter = document.querySelector('.counter');
    
    counter.textContent = value;
  });
