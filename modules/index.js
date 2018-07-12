const payloadPassThrough = (state, payload) => payload;

const createReducer = (...actionHandlers) => (defaultValue = null) => {
    const actions = actionHandlers.reduce(
        (acc, actionSpec) => {
            actionSpec = [].concat(actionSpec);
            const last = actionSpec.slice(-1)[0];
            const actionReducer = typeof last === 'function' ? last : payloadPassThrough;
            const actionTypes = actionReducer === payloadPassThrough ? actionSpec : actionSpec.slice(0, -1);

            actionTypes.forEach(actionType => acc[actionType] = actionReducer);
            return acc;
        },
        {}
    );

    return (state, { type, payload, error }) => {
        if (actions[type]) {
            return actions[type](state, payload, error);
        }

        return typeof state === 'undefined' ? defaultValue : state;
    };
};

export default createReducer;

export const whenError = (reducer = payloadPassThrough) => (state, payload, error) =>
    error ? reducer(state, payload) : state;

export const whenSuccess = (reducer = payloadPassThrough) => (state, payload, error) =>
    error ? state : reducer(state, payload);

export const extendReducer = (reducer) => (...actionHandlers) => (defaultValue = null) => {
  const extraReducer = createReducer(...actionHandlers)(defaultValue);
  return (state, action) =>
    extraReducer(reducer(state, action), action);
}

export const bindReducer = (actionOrActions, unboundReducer) => {
  const actions = [].concat(actionOrActions)
  actions.forEach((action) => {
    if (typeof action !== 'string') {
      throw new Error('Action type must be a string, received: ' + action);
    }
  })

  if (typeof unboundReducer !== 'function') {
    throw new Error('Reducer must be a function, received: ' + unboundReducer);
  }

  return createReducer([...actions, unboundReducer])
}
