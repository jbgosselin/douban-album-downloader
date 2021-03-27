import { START_DOWNLOADING_ALBUM } from "../actionTypes";
import { STEPS } from '../../constants';

const initialState = {
    step: STEPS.INPUT_URL,
};

export default function (state = initialState, action) {
    switch (action.type) {
        case START_DOWNLOADING_ALBUM: {
            return {
                ...state,
                step: STEPS.DOWNLOADING,
            };
        }
        default:
            return state;
    }
}
