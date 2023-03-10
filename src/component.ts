import type { Component } from 'systemic';

interface SignalOptions<TData = any> {
  data?: TData;
}

interface SignalFn<TSignals extends Record<string, unknown>> {
  <TKey extends keyof TSignals>(key: TKey, options?: SignalOptions<TSignals[TKey]>): void;
  (options?: SignalOptions<any>): void;
}

interface AwaitFn<TSignals extends Record<string, unknown>> {
  <TKey extends keyof TSignals>(key: TKey, timeoutMs?: number): Promise<TSignals[TKey]>;
  <TExpected = any>(timeoutMs?: number): Promise<TExpected>;
}

type PublishFn<TSignals extends Record<string, unknown>> = <TKey extends keyof TSignals & string>(
  key: TKey,
  data: TSignals[TKey],
) => void;

type CallBack<TData> = (data: TData, context: Record<string, unknown>) => void;

type SubscribeFn<TSignals extends Record<string, unknown> = any> = <TKey extends keyof TSignals & string>(
  key: TKey,
  callback: CallBack<TSignals[TKey]>,
) => void;

export interface Converse<TSignals extends Record<string, unknown> = Record<string, any>> {
  signal: SignalFn<TSignals>;
  await: AwaitFn<TSignals>;

  publish: PublishFn<TSignals>;
  subscribe: SubscribeFn<TSignals>;
  unsubscribe: SubscribeFn<TSignals>;
}

export interface Config {
  maxSignals: number;
}

interface SignalContext {
  timestamp: number;
  resolve?: (data: any) => void;
  resultPromise: Promise<any>;
}

const defaultKey = '__default__';

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number | undefined): Promise<T> => {
  if (!timeoutMs) return promise;
  const timeout = new Promise<T>((resolve, reject) =>
    setTimeout(() => reject(new Error('A timeout occured while waiting for a converse promise to resolve')), timeoutMs),
  );
  return Promise.race([promise, timeout]);
};

export const initConverse = <TSignals extends Record<string, unknown> = Record<string, any>>(): Component<
  Converse<TSignals>,
  { config?: Config }
> => ({
  start: async ({ config: { maxSignals = 1000 } = {} }) => {
    if (maxSignals < 1) throw new Error('maxSignals must be higher or equal to 1');

    const signalRegistrations: Record<string, SignalContext> = {};
    const pubSubRegistrations = {} as { [K in keyof TSignals]: CallBack<TSignals[K]>[] };

    const addContext = (key: string, context: SignalContext) => {
      const currentContexts = Object.entries(signalRegistrations);
      if (currentContexts.length >= maxSignals - 1 && !(key in signalRegistrations)) {
        currentContexts.sort(([, { timestamp: first }], [, { timestamp: second }]) => first - second);
        const [[oldestKey]] = currentContexts;
        delete signalRegistrations[oldestKey];
      }

      signalRegistrations[key] = context;
    };

    return {
      signal: (arg0?: string | SignalOptions, arg1?: SignalOptions) => {
        const key = typeof arg0 === 'string' ? arg0 : defaultKey;
        const options = typeof arg0 === 'object' ? arg0 : arg1;

        if (!signalRegistrations[key]) {
          return addContext(key, { timestamp: Date.now(), resultPromise: Promise.resolve(options?.data) });
        }

        const signalContext = signalRegistrations[key];
        if (!signalContext.resolve) throw new Error(`Signal with key ${key} has already been resolved`);

        signalContext.resolve(options?.data);
        delete signalContext.resolve;
      },
      await: (arg0?: string | number, arg1?: number) => {
        const key = typeof arg0 === 'string' ? arg0 : defaultKey;
        const timeoutMs = typeof arg0 === 'number' ? arg0 : arg1;

        if (signalRegistrations[key]) return withTimeout(signalRegistrations[key].resultPromise, timeoutMs);

        const signalContext = { timestamp: Date.now() } as SignalContext;
        signalContext.resultPromise = new Promise(resolve => {
          signalContext.resolve = resolve;
        });
        addContext(key, signalContext);

        return withTimeout(signalContext.resultPromise, timeoutMs);
      },
      publish: (key, data) => {
        const subscribers = pubSubRegistrations[key];
        if (subscribers) {
          const context = {};
          subscribers.forEach(callback => callback(data, context));
        }
      },
      subscribe: (key, callback) => {
        if (!pubSubRegistrations[key]) pubSubRegistrations[key] = [];
        pubSubRegistrations[key].push(callback);
      },
      unsubscribe: (key, callback) => {
        pubSubRegistrations[key] = pubSubRegistrations[key]?.filter(registration => registration !== callback) || [];
      },
    };
  },
});
