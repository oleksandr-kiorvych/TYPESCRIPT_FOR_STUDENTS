enum HTTP_METHODS {
  HTTP_POST_METHOD = 'POST',
  HTTP_GET_METHOD = 'GET',
}

enum HTTP_STATUSES {
  HTTP_STATUS_OK = 200,
  HTTP_STATUS_INTERNAL_SERVER_ERROR = 500,
}

enum Roles {
  USER = 'user',
  ADMIN = 'admin',
}

interface IRequestObject {
  method: HTTP_METHODS;
  host: string;
  path: string;
  params: {
    id?: string;
  };
  body?: IUser;
}

type TStatusOk = { status: HTTP_STATUSES.HTTP_STATUS_OK };
type TStatusError = { status: HTTP_STATUSES.HTTP_STATUS_INTERNAL_SERVER_ERROR };

type TNextFunc = (request: IRequestObject) => TStatusOk | void;
type TErrorFunc = (error: never) => TStatusError | void;
type TCompleteFunc = () => void;

type TSubscribeFunc = (observer: IObserver) => () => void;

interface IHandlers {
  next: TNextFunc;
  error: TErrorFunc;
  complete: TCompleteFunc;
}

interface IObserver extends IHandlers {
  handlers: IHandlers;
  isUnsubscribed: boolean;
  unsubscribe: () => void;
}

interface IObservable {
  _subscribe: TSubscribeFunc;
  subscribe: (obs: IObserver) => { unsubscribe(): void };
}

class Observer implements IObserver {
  private _handlers: IHandlers;
  private _isUnsubscribed: boolean = false;
  _unsubscribe?: () => void;

  public get handlers() {
    return this._handlers;
  }

  public get isUnsubscribed() {
    return this._isUnsubscribed;
  }

  constructor(handlers: IHandlers) {
    this._handlers = handlers;
  }

  public next(value: IRequestObject) {
    if (this._handlers.next && !this._isUnsubscribed) {
      this._handlers.next(value);
    }
  }

  public error(error: never) {
    if (!this._isUnsubscribed) {
      if (this._handlers.error) {
        this._handlers.error(error);
      }

      this.unsubscribe();
    }
  }

  public complete() {
    if (!this._isUnsubscribed) {
      if (this._handlers.complete) {
        this._handlers.complete();
      }

      this.unsubscribe();
    }
  }

  public unsubscribe() {
    this._isUnsubscribed = true;

    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}

class Observable implements IObservable {
  _subscribe: TSubscribeFunc;

  constructor(subscribe: TSubscribeFunc) {
    this._subscribe = subscribe;
  }

  static from(values: IRequestObject[]) {
    return new Observable((observer) => {
      values.forEach((value) => observer.next(value));

      observer.complete();

      return () => {
        console.log('unsubscribed');
      };
    });
  }

  subscribe(
    obs: Omit<IObserver, 'handlers' | 'isUnsubscribed' | 'unsubscribe'>
  ) {
    const observer = new Observer(obs);

    observer._unsubscribe = this._subscribe(observer);

    return {
      unsubscribe() {
        observer.unsubscribe();
      },
    };
  }
}

interface IUser {
  name: string;
  age: number;
  roles: Roles[];
  createdAt: Date;
  isDeleated: boolean;
}

const userMock = {
  name: 'User Name',
  age: 26,
  roles: [Roles.USER, Roles.ADMIN],
  createdAt: new Date(),
  isDeleated: false,
};

const requestsMock = [
  {
    method: HTTP_METHODS.HTTP_POST_METHOD,
    host: 'service.example',
    path: 'user',
    body: userMock,
    params: {},
  },
  {
    method: HTTP_METHODS.HTTP_GET_METHOD,
    host: 'service.example',
    path: 'user',
    params: {
      id: '3f5h67s4s',
    },
  },
];

const handleRequest: TNextFunc = (request) => {
  // handling of request
  return { status: HTTP_STATUSES.HTTP_STATUS_OK };
};
const handleError: TErrorFunc = (error) => {
  // handling of error
  return { status: HTTP_STATUSES.HTTP_STATUS_INTERNAL_SERVER_ERROR };
};

const handleComplete: TCompleteFunc = () => console.log('complete');

const requests$ = Observable.from(requestsMock);

const subscription = requests$.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete,
});

subscription.unsubscribe();
