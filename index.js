const { intent, interpret, ensure } = require('intention')();
const DEFAULT_VALUE_SYM = Symbol('@@default');
const MISSING_VALUE_SYM = Symbol('@@missing');

const monads = new WeakMap();

const monad = (type, ctors) => Object.keys(ctors).reduce((result, instance) => {
    result[instance] = (...args) => {
      const monadicValues = {
        args,
        type,
        instance,
        ctor: ctors[instance],
      };
      const monadicValue = intent(`monad:value`, monadicValues);
      monads.set(monadicValue, monadicValues);
      return monadicValue;
    };

    return result;
  }, Object.create(null));

const match = (monadicValue, matches, defaultValue=DEFAULT_VALUE_SYM) => {
  if (!monads.has(monadicValue)) throw new Error('Cannot match a non-monad');
  if (defaultValue === DEFAULT_VALUE_SYM) return intent('monad:match', {
    monadicValue,
    matches,
  });
  const { args, instance } = monads.get(monadicValue);
  if (instance in matches) return matches[instance](...args);
  return defaultValue;
};

const monadicReality = Object.freeze({
  'monad:value': ({ args, ctor }, resolve, reject) => {
    try {
      const value = ctor(...args);
      return resolve(value);
    } catch (e) {
      return reject(e);
    }
  },

  'monad:match': ({ monadicValue, matches }, resolve, reject) => {
    const value = match(monadicValue, matches, MISSING_VALUE_SYM);
    return (value === MISSING_VALUE_SYM ?
      reject(new Error('Match not found')) :
      resolve(value));
  },
});

const enableMonads = interpretF => (intentObject, reality) =>
  (ensure(intentObject) ?
    interpret(intentObject, monadicReality) :
    interpretF(intentObject, reality));

module.exports = {
  monad,
  enableMonads,
  match,
};
