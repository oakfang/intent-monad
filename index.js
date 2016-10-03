const { intent, interpret, isIntent } = require('intention')();
const DEFAULT_VALUE_SYM = Symbol('@@default');
const MISSING_VALUE_SYM = Symbol('@@missing');

const monad = (type, ctors) => Object.keys(ctors).reduce((result, instance) => {
    result[instance] = (...args) => intent(`monad:value`, {
      args,
      type,
      instance,
      ctor: ctors[instance],
    });

    return result;
  }, Object.create(null));

const match = (monadicValue, matches, defaultValue=DEFAULT_VALUE_SYM) => {
  if (!isIntent(monadicValue)) throw new Error('Cannot match a non-monad');
  if (defaultValue === DEFAULT_VALUE_SYM) return intent('monad:match', {
    monadicValue,
    matches,
  });
  const { args, instance } = monadicValue.values;
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
  (isIntent(intentObject) ?
    interpret(intentObject, monadicReality) :
    interpretF(intentObject, reality));

module.exports = {
  monad,
  enableMonads,
  match,
};
