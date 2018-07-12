import { expect } from 'chai';

import createReducer, {
  whenError,
  whenSuccess,
  extendReducer,
  bindReducer
} from '../modules';

describe('createReducer', () => {
    it('should reduce a multiple actions with custom action reducers', () => {
        const initialState = []
        const reducer = createReducer(
            initialState,
            bindReducer('ADD_ITEM', (state, payload) => state.concat(payload)),
            bindReducer('REMOVE_ITEM', (state, payload) => state.filter(item => item !== payload)),
            bindReducer('RESET', () => [])
        );

        let state = reducer([], { type: 'ADD_ITEM', payload: 'item1' });
        expect(state).to.eql([ 'item1' ]);

        state = reducer(state, { type: 'ADD_ITEM', payload: 'item2' });
        expect(state).to.eql([ 'item1', 'item2' ]);

        state = reducer(state, { type: 'REMOVE_ITEM', payload: 'item1' });
        expect(state).to.eql([ 'item2' ]);

        state = reducer(state, { type: 'RESET', payload: 'item1' });
        expect(state).to.eql([]);
    });

    it('chains multiple reducers together when they are bound to the same action', () => {
      const initialState = { counter: 1 }
      const reducer = createReducer(initialState,
        bindReducer('INCREMENT', (state) => ({ counter: state.counter + 1 })),
        bindReducer('INCREMENT', ({ counter }) => ({ counter, hasCounted: true }))
      );

      let state = reducer(initialState, { type: 'INCREMENT' })
      expect(state).to.deep.equal({ counter: 2, hasCounted: true })
    })
});

describe('whenError', () => {
    it('should only reduce error payloads', () => {
        const reducer = createReducer(
          null,
          bindReducer('RECEIVE_ITEMS', whenError((state, payload) => payload))
        );

        let state = reducer(null, { type: 'RECEIVE_ITEMS', payload: [ 'item1', 'item2' ] });
        expect(state).to.equal(null);

        state = reducer(state, { type: 'RECEIVE_ITEMS', payload: { status: 500 }, error: true });
        expect(state).to.eql({ status: 500 });
    });
});

describe('whenSuccess', () => {
    it('should only reduce error payloads', () => {
        const reducer = createReducer(
            [],
            bindReducer('RECEIVE_ITEMS', whenSuccess((state, payload) => state.concat(payload)))
        );

        let state = reducer([], { type: 'RECEIVE_ITEMS', payload: { status: 500 }, error: true });
        expect(state).to.eql([]);

        state = reducer(state, { type: 'RECEIVE_ITEMS', payload: [ 'item1', 'item2' ] });
        expect(state).to.eql([ 'item1', 'item2' ]);
    });
});

describe('extendReducer', () => {
  it('should reduce a single action with custom action reducers', () => {
      const reducer = createReducer('', bindReducer('SEARCH'));
      const extendedReducer = extendReducer(reducer)('', bindReducer('RESET', () => ''))
      let state = extendedReducer('', { type: 'SEARCH', payload: 'abc' });
      expect(state).to.equal('abc');
      state = extendedReducer(state, { type: 'RESET' });
      expect(state).to.equal('');
  });

  it('should extend a single action with another single action', () => {
      const reducer = createReducer('', bindReducer('SEARCH'));
      const extendedReducer = extendReducer(reducer)('', bindReducer('SEARCH_AGAIN'));
      let state = extendedReducer('', { type: 'SEARCH', payload: 'abc' });
      expect(state).to.equal('abc');
      state = extendedReducer(state, { type: 'SEARCH_AGAIN', payload: 'def' });
      expect(state).to.equal('def');
  });

  it('should reduce multiple actions with custom action reducers', () => {
      const reducer = createReducer('', bindReducer([ 'SEARCH', 'SEARCH_AGAIN' ]));
      const extendedReducer = extendReducer(reducer)('', bindReducer(['RESET', 'EMPTY'], () => ''));

      let state = extendedReducer('', { type: 'SEARCH', payload: 'abc' });
      expect(state).to.equal('abc');

      state = extendedReducer(state, { type: 'RESET' });
      expect(state).to.equal('');

      state = extendedReducer(state, { type: 'SEARCH_AGAIN', payload: 'def' });
      expect(state).to.equal('def');

      state = extendedReducer(state, { type: 'EMPTY' });
      expect(state).to.equal('');
  });
});


describe('bindReducer', () => {
    it('should bind a reducer to a single action', () => {
        const boundReducer = bindReducer('RESET', () => 'reset');
        const initialState = {};
        const reducer = boundReducer(initialState);

        let state = reducer(initialState, { type: 'RESET' });
        expect(state).to.equal('reset');
    })

    it('should bind a reducer to multiple actions', () => {
        const boundReducer = bindReducer(['RESET', 'REVERT'], () => 'reset');
        const initialState = {};
        const reducer = boundReducer(initialState);

        expect(reducer(initialState, { type: 'RESET' })).to.equal('reset');
        expect(reducer(initialState, { type: 'REVERT' })).to.equal('reset');
    })

    it('should throw if the action is not a string, and include the received action type', () => {
        expect(() => bindReducer(undefined, () => {}))
            .to.throw('Action type must be a string, received: undefined');
    })

    it('should behave as payloadPassThrough when no reducer is given with a single action', () => {
        const boundReducer = bindReducer('RESET')
        const initialState = {};
        const reducer = boundReducer(initialState);

        let state = reducer(initialState, { type: 'RESET', payload: 'passed through'})
        expect(state).to.equal('passed through');
    })

    it('should behave as payloadPassThrough when no reducer is given with multiple actions', () => {
        const boundReducer = bindReducer(['RESET', 'REVERT'])
        const initialState = {};
        const reducer = boundReducer(initialState);

        let state = reducer(initialState, { type: 'REVERT', payload: 'passed through'})
        expect(state).to.equal('passed through');
    })
})
