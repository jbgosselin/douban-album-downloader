import { combineReducers } from "redux";
import step from "./step";
import downloads from './downloads';

export default combineReducers({ step, downloads });
