import test from 'ava';
import { interpret as interpretBase, intent } from 'intention';
import { monad, match, enableMonads } from '.';

const interpret = enableMonads(interpretBase);

const maybe = monad('maybe', {
  just(x) {
    return x;
  },

  nothing() {
    throw new Error('No value provided');
  },
});

const { just, nothing } = maybe;
const getValue = (object, key) => key in object ? just(object[key]) : nothing();

test('Matching works', t => {
  const o = { a: 5 };
  const a = match(getValue(o, 'a'), {
    just(x) { return x },
    nothing() { return 0 },
  }, null);
  t.is(a, 5);
});

test('Matching uses default value on fail', t => {
  const o = { a: 5 };
  const a = match(getValue(o, 'b'), {
    just(x) { return x },
  }, 0);
  t.is(a, 0);
});

test('Exposing works', async t => {
  const o = { a: 5 };
  t.is(await interpret(getValue(o, 'a')), 5);
  try {
    await interpret(getValue(o, 'b'));
    t.fail('should have failed');
  } catch (e) {
    t.is(e.message, 'No value provided');
  }

  t.is(await(interpret(intent('foo', 4), {
    foo: (x, resolve) => resolve(x),
  })), 4);
});

test('Matching a non-monad is doomed', t => {
  try {
    match({}, {});
    t.fail('Should have failed');
  } catch (e) {
    t.truthy(e.message.includes('non-monad'));
  }
});

test('Matching with no default value is an intent', async t => {
  const o = { a: 5 };
  const a = match(getValue(o, 'a'), {
    just(x) { return x },
  });
  t.not(a, 5);
  t.is(await interpret(a), 5);
  try {
    await interpret(match(getValue(o, 'b'), {
      just(x) { return x },
    }));
    t.fail('should have failed');
  } catch (e) {
    t.is(e.message, 'Match not found');
  }
});
