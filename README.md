# systemic-converse

A [Systemic component](https://github.com/onebeyond/systemic) that lets other systemic components converse in the direction opposite of their dependency or to multiple components at once.

## 🎆 Special thanks 🎆

[Betisman](https://github.com/Betisman), [neodmy](https://github.com/neodmy), [hamsaaldrobi](https://github.com/hamsaaldrobi)

A parting gift with many thanks for all your amazing efforts over the years. Hopefully we’ll ‘Converse’ many more times in the future!

Your friends from the Integrations team

[teunmooij](https://github.com/teunmooij), [hustler](https://github.com/hustler), [john](https://github.com/theunisjohn), [nanotower](https://github.com/nanotower), [akoszoltangoracz](https://github.com/akoszoltangoracz), [gianluca](https://github.com/gianlucadonato). [sergio](https://github.com/sergioCB95)

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

`systemic-converse` supports 2 patterns:

- Notifications:
  - a notification can be sent only once
  - subscribers can await the notification
  - subscribers can request the notification after it was already published
- Pub / sub:
  - mutliple notifications can be sent
  - subscribers provide a callback that gets called with each notification
  - subscribers only receive publications that are publisher after they registered their subscription

### Notifications

Notify other components:

```typescript
converse.signal({ data: 'Betisman has left the building' });
```

or with a named signal:

```typescript
converse.signal('system-started', { data: 42 });
```

and in other components wait for a signal:

```typescript
const timeoutMs = 15000;
await converse.await('system-started', timeoutMs);
```

### Pub / Sub

Publish to other components:

```typescript
converse.publish('leaving-party', 'The party has started');
```

and in other components subscribe to this publication:

```typescript
const handler = (data, context) => {
  // ...
};
converse.subscribe('leaving-party', handler);
```

or unsubscribe when you're no longer interested:

```typescript
converse.unsubscribe('leaving-party', handler);
```

## Version history

### v1.0

- Initial version
