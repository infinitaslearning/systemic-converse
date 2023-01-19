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

export interface Converse<TSignals extends Record<string, unknown> = Record<string, any>> {
  signal: SignalFn<TSignals>;
  await: AwaitFn<TSignals>;
}

export interface Config {
  maxSignals: number;
}

interface SignalContext {
  timestamp: number;
  resolve?: (data: any) => void;
  resultPromise: Promise<any>;
}

const defaultKey = 'Betisman';
const timeoutKey = 'neodmy';

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number | undefined): Promise<T> => {
  if (!timeoutMs) return promise;
  const sleep = new Promise<typeof timeoutKey>(resolve => setTimeout(() => resolve(timeoutKey), timeoutMs));
  return Promise.race([promise, sleep]).then(value => {
    if (value === timeoutKey) throw new Error('A timeout occured while waiting for a converse promise to resolve');
    return value;
  });
};

export const initConverse = <TSignals extends Record<string, unknown> = Record<string, any>>(): Component<
  Converse<TSignals>,
  { config?: Config }
> => ({
  start: async ({ config: { maxSignals = 1000 } = {} }) => {
    if (maxSignals < 1) throw new Error('maxSignals must be higher or equal to 1');

    const contexts: Record<string, SignalContext> = {};

    const addContext = (key: string, context: SignalContext) => {
      const currentContexts = Object.entries(contexts);
      if (currentContexts.length >= maxSignals - 1 && !(key in contexts)) {
        currentContexts.sort(([, { timestamp: first }], [, { timestamp: second }]) => first - second);
        const [[oldestKey]] = currentContexts;
        delete contexts[oldestKey];
      }

      contexts[key] = context;
    };

    return {
      signal: (arg0?: string | SignalOptions, arg1?: SignalOptions) => {
        const key = typeof arg0 === 'string' ? arg0 : defaultKey;
        const options = typeof arg0 === 'object' ? arg0 : arg1;

        if (!contexts[key]) {
          return addContext(key, { timestamp: Date.now(), resultPromise: Promise.resolve(options?.data) });
        }

        const signalContext = contexts[key];
        if (!signalContext.resolve) throw new Error(`Signal with key ${key} has already been resolved`);

        signalContext.resolve(options?.data);
        delete signalContext.resolve;
      },
      await: (arg0?: string | number, arg1?: number) => {
        const key = typeof arg0 === 'string' ? arg0 : defaultKey;
        const timeoutMs = typeof arg0 === 'number' ? arg0 : arg1;

        if (contexts[key]) return withTimeout(contexts[key].resultPromise, timeoutMs);

        const signalContext = { timestamp: Date.now() } as SignalContext;
        signalContext.resultPromise = new Promise(resolve => {
          signalContext.resolve = resolve;
        });
        addContext(key, signalContext);

        return withTimeout(signalContext.resultPromise, timeoutMs);
      },
    };
  },
});
