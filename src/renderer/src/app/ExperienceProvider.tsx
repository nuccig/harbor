import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type PropsWithChildren
} from 'react'
import {
  createInitialExperienceState,
  experienceReducer,
  type ExperienceAction,
  type ExperienceState
} from './experience-model'

const ExperienceStateContext = createContext<ExperienceState | undefined>(undefined)
const ExperienceDispatchContext = createContext<Dispatch<ExperienceAction> | undefined>(undefined)

export function ExperienceProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(
    experienceReducer,
    undefined,
    createInitialExperienceState
  )

  return (
    <ExperienceStateContext.Provider value={state}>
      <ExperienceDispatchContext.Provider value={dispatch}>
        {children}
      </ExperienceDispatchContext.Provider>
    </ExperienceStateContext.Provider>
  )
}

export function useExperienceState(): ExperienceState {
  const state = useContext(ExperienceStateContext)

  if (state === undefined) {
    throw new Error('useExperienceState must be used inside ExperienceProvider')
  }

  return state
}

export function useExperienceDispatch(): Dispatch<ExperienceAction> {
  const dispatch = useContext(ExperienceDispatchContext)

  if (dispatch === undefined) {
    throw new Error('useExperienceDispatch must be used inside ExperienceProvider')
  }

  return dispatch
}

export function useExperience(): [
  state: ExperienceState,
  dispatch: Dispatch<ExperienceAction>
] {
  return [useExperienceState(), useExperienceDispatch()]
}
