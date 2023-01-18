import type { Component } from 'systemic';

interface SignalOptions {
  data?: any;
}

interface SignalFn {
  (key: string, options?: SignalOptions): void;
  (options?: SignalOptions): void;
}

interface AwaitFn {
  <TExpected = any>(key: string, timeout?: number): Promise<TExpected>;
  <TExpected = any>(timeout?: number): Promise<TExpected>;
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
  data?: any;
  waitPromise?: Promise<any>;
}

const defaultKey = 'Betisman';

const isResolved = async (promise: Promise<any>) => {
  const test = {};
  const first = await Promise.race([promise, test]);
  return first !== test;
};

export const initConverse = (): Component<Converse, { config?: Config }> => ({
  start: async ({ config: { maxSignals = 1000 } = {} }) => {
    const contexts: Record<string, SignalContext> = {};

    const awaitfn: AwaitFn = async () => { }

    return {
      signal: (...args) => {
        const key = typeof args[0] === 'string' ? args[0] : defaultKey;
        const options = typeof args[0] === 'object' ? args[0] : args[1];


      },
      await: awaitfn,
    };
  },
});
