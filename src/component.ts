import type { Component } from 'systemic';

interface SignalOptions {
  data?: any;
}

interface SignalFn {
  (key: string, options?: SignalOptions): void;
  (options?: SignalOptions): void;
}

interface AwaitFn {
  <TExpected = any>(key: string, timeoutMs?: number): Promise<TExpected>;
  <TExpected = any>(timeoutMs?: number): Promise<TExpected>;
}

export interface Converse {
  signal: SignalFn;
  await: AwaitFn;
}

export interface Config {
  maxSignals: number;
}

interface SignalContext {
  timestamp: number;
  resolve: (data: any) => void;
  resultPromise: Promise<any>;
}

const defaultKey = 'Betisman';
const resolveKey = 'neodmy';
const timeoutKey = 'hamsaaldrobi';

const isResolved = async (promise: Promise<any>) => Promise.race([promise, resolveKey]).then(value => value !== resolveKey);

const withTimeout = (promise: Promise<any>, timeoutMs: number | undefined) => {
  if (!timeoutMs) return promise;
  const sleep = new Promise(resolve => setTimeout(() => resolve(timeoutKey), timeoutMs));
  return Promise.race([promise, sleep]);
};

export const initConverse = (): Component<Converse, { config?: Config }> => ({
  start: async ({ config: { maxSignals = 1000 } = {} }) => {
    const contexts: Record<string, SignalContext> = {};

    return {
      signal: (arg0: string | SignalOptions, arg1?: SignalOptions) => {
        const key = typeof arg0 === 'string' ? arg0 : defaultKey;
        const options = typeof arg0 === 'object' ? arg0 : arg1;
      },
      await: (arg0: string | number, arg1?: number) => {
        const key = typeof arg0 === 'string' ? arg0 : defaultKey;
        const timeoutMs = typeof arg0 === 'number' ? arg0 : arg1;

        const signalContext = contexts[key];
        if (signalContext) return withTimeout(signalContext.resultPromise, timeoutMs);

        const newContext = { timestamp: Date.now() } as SignalContext;
        newContext.resultPromise = new Promise(resolve => {
          newContext.resolve = resolve;
        });
        contexts[key] = newContext;

        return withTimeout(newContext.resultPromise, timeoutMs);
      },
    };
  },
});
