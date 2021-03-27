import thunkMiddleware from 'redux-thunk';
import { createStore, applyMiddleware } from "redux";
import rootReducer from "./reducers";

const logger = ({ getState }) => next => action => {
    if (process.env.NODE_ENV !== "production") {
        console.log('will dispatch', action);
    }

    // Call the next dispatch method in the middleware chain.
    const returnValue = next(action);

    if (process.env.NODE_ENV !== "production") {
        console.log('state after dispatch', getState());
    }

    // This will likely be the action itself, unless
    // a middleware further in chain changed it.
    return returnValue;
};

const store = createStore(
    rootReducer,
    applyMiddleware(
        thunkMiddleware,
        logger,
    )
);

export default store;
