# systemic-converse

A [Systemic component](https://github.com/onebeyond/systemic) that let's other systemic components converse in the direction opposite of their dependency or to multiple components at once.

## Special thanks

[Betisman](https://github.com/Betisman), [neodmy](https://github.com/neodmy), [hamsaaldrobi](https://github.com/hamsaaldrobi)

A parting gift with many thanks for all your amazing efforts over the years. Hopefully we’ll ‘Converse’ many more times in the future!

Your friends from the Integrations team

[teunmooij](https://github.com/teunmooij), [hustler](https://github.com/hustler), [john](https://github.com/theunisjohn)

## Installation

```shell
$ npm install systemic-converse
```

## Usage

Add the component to your system:

```typescript
import System from 'systemic';
import initConverse from 'systemic-converse';

new System().add('converse', initConverse()).start((err, components) => {
  // Do stuff with components.converse
});
```

Then use it to notify other components:

```typescript
converse.signal({ data: 'Betisman left the building' });
```

or with a named signal:

```typescript
converse.signal('system-started', { data: 42 });
```

and in other components wait for a signal:

```typescript
const timeoutMs = 15000;
await signal.await('system-started', timeoutMs);
```

## Version history

### v1.0

- Initial version
