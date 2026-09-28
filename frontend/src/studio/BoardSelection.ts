import {createContext,useContext} from 'react'
export const BoardSelectionContext=createContext<{choose:(id:string)=>void}|null>(null)
export const useBoardSelection=()=>useContext(BoardSelectionContext)
