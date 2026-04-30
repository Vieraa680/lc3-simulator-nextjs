import { Action } from 'redux'
import { combineEpics, createEpicMiddleware } from 'redux-observable'
import { IState } from '../reducers'

export const rootEpic = combineEpics()

export default createEpicMiddleware<Action, Action, IState>()
