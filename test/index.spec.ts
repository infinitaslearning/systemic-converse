import systemic from 'systemic';
import initConverse, { Converse } from '../src';

const testKey = 'hamsaaldrobi';

const isResolved = (p: Promise<any>) => Promise.race([p, 'unresolved']).then(value => value !== 'unresolved');

describe('component tests', () => {
  it('allows a waiter to pick up data that was already signaled', async () => {
    const data = { hello: 'world' };

    const converse = await initConverse<{ [testKey]: typeof data }>().start({});

    converse.signal(testKey, { data });
    const result = await converse.await(testKey);

    expect(result).toBe(data);
  });

  it('allows a waiter to wait for signaled data', async () => {
    const data = { hello: 'world' };

    const converse = await initConverse().start({});

    const resultPromise = converse.await(testKey);
    expect(await isResolved(resultPromise)).toBe(false);

    converse.signal(testKey, { data });

    expect(await resultPromise).toBe(data);
  });

  it('allows a waiter to wait for a signal without data', async () => {
    const converse = await initConverse().start({});

    const resultPromise = converse.await(testKey);
    expect(await isResolved(resultPromise)).toBe(false);
    converse.signal(testKey);

    await resultPromise;
    expect(await isResolved(resultPromise)).toBe(true);
  });

  it('supports multiple keys', async () => {
    const data1 = 1;
    const data2 = 2;

    const converse = await initConverse().start({});

    converse.signal('key1', { data: data1 });
    converse.signal('key2', { data: data2 });

    expect(await converse.await('key2')).toBe(2);
    expect(await converse.await('key1')).toBe(1);
  });

  it('works between systemic components', async () => {
    type Signals = { hamsaaldrobi: string; done: void };
    type TestConverse = Converse<Signals>;

    const data = '¿Qué tal?';
    const recorder = jest.fn();

    const Betisman = {
      start: ({ converse }: { converse: TestConverse }) => {
        (async () => {
          recorder('waiting for system');
          await converse.await();
          recorder('signaling from Betisman');
          converse.signal('hamsaaldrobi', { data });
        })();

        return Promise.resolve();
      },
    };

    const neodmy = {
      start: ({ converse }: { converse: TestConverse }) => {
        (async () => {
          const question = await converse.await('hamsaaldrobi');
          recorder(`Received "${question}", signaling from neodmy`);
          converse.signal('done');
        })();

        return Promise.resolve();
      },
    };

    const system = systemic()
      .add('converse', initConverse())
      .add('Betisman', Betisman)
      .dependsOn('converse')
      .add('neodmy', neodmy)
      .dependsOn('converse');

    const { converse } = await system.start();
    recorder('system is ready');
    converse.signal();
    await converse.await('done');
    recorder('Thanks Betisman, neodmy and hamsaaldrobi');

    expect(recorder).toHaveBeenNthCalledWith(1, 'waiting for system');
    expect(recorder).toHaveBeenNthCalledWith(2, 'system is ready');
    expect(recorder).toHaveBeenNthCalledWith(3, 'signaling from Betisman');
    expect(recorder).toHaveBeenNthCalledWith(4, 'Received "¿Qué tal?", signaling from neodmy');
    expect(recorder).toHaveBeenNthCalledWith(5, 'Thanks Betisman, neodmy and hamsaaldrobi');
  });

  it('throws if a timeout occures while waiting for a signal', async () => {
    const converse = await initConverse().start({});

    const test = () => converse.await(20);

    await expect(test()).rejects.toThrow('A timeout occured while waiting for a converse promise to resolve');
  });

  it('can wait for the same signal multiple times', async () => {
    const converse = await initConverse().start({});

    const waiter1 = converse.await(testKey);
    const waiter2 = converse.await(testKey);

    converse.signal(testKey, { data: 'done' });

    expect(await waiter1).toBe('done');
    expect(await waiter2).toBe('done');
    expect(await converse.await(testKey)).toBe('done');
  });

  it('cannot signal twice with the same key (until it gets evicted)', async () => {
    const converse = await initConverse().start({});

    converse.signal(testKey);
    const test = () => converse.signal(testKey);

    expect(test).toThrow('Signal with key hamsaaldrobi has already been resolved');
  });

  it('removes the oldest signal when maxSignals is reached', async () => {
    const converse = await initConverse().start({ config: { maxSignals: 2 } });

    converse.signal('a', { data: 1 });
    converse.signal('b', { data: 2 });
    converse.signal('c');

    expect(await converse.await('a')).toBe(1);

    converse.signal('d');

    const result = converse.await('a');

    expect(await isResolved(result)).toBe(false);
    expect(await converse.await('b')).toBe(2);
  });
});
