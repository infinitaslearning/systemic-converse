# systemic-converse

A [Systemic component](https://github.com/onebeyond/systemic) that let's other systemic components converse in the direction opposite of their dependency or to multiple components at once.

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
