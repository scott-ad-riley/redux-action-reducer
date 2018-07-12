const payloadPassThrough = (state, payload) => payload;

const createReducer = (defaultValue = null, ...boundReducerCreators) => {
  const boundReducers = boundReducerCreators.map(creator => creator(defaultValue))
  return (state, payload) => boundReducers.reduce((acc, boundReducer) => {
      return boundReducer(acc, payload);
  }, state)
}


export default createReducer;

export const whenError = (reducer = payloadPassThrough) => (state, payload, error) =>
    error ? reducer(state, payload) : state;

export const whenSuccess = (reducer = payloadPassThrough) => (state, payload, error) =>
    error ? state : reducer(state, payload);

export const extendReducer = (reducer) => (defaultValue = null, ...boundReducers) => {
  const extraReducer = createReducer(defaultValue, ...boundReducers);
  return (state, action) =>
    extraReducer(reducer(state, action), action);
}

export const bindReducer = (actionOrActions, unboundReducer = payloadPassThrough) => {
  const actions = [].concat(actionOrActions)
  actions.forEach((action) => {
    if (typeof action !== 'string') {
      throw new Error('Action type must be a string, received: ' + action);
    }
  })

  const boundActions = actions.reduce(
      (acc, action) => {
          acc[action] = unboundReducer
          return acc;
      },
      {}
  );

  const boundActionsArray = Object.keys(boundActions).map(key => ([key, boundActions[key]]));

  return (defaultValue) => (state, { type, payload, error }) =>
      boundActionsArray.reduce((accState, [actionType, reducer]) => {
          if (type === actionType) {
              return reducer(accState, payload, error);
          }

          return accState;
      }, state)
}
