import {createContext,useContext,useState,type ReactNode,type FormEvent} from 'react'
import {Mountain,UserRound,LockKeyhole,ArrowRight,Eye,EyeOff} from 'lucide-react'
import {clearLocalSession,readLocalSession,saveLocalSession,validLocalCredentials,PRODUCT_VERSION,type LocalSession} from './localSession'

const LocalAuth=createContext({user:'root',logout:()=>{}})
export const useLocalAuth=()=>useContext(LocalAuth)
export function LocalLogin({children}:{children:ReactNode}){
 const [session,setSession]=useState<LocalSession|null>(()=>{try{return readLocalSession(sessionStorage)}catch{return null}})
 const [user,setUser]=useState(''),[password,setPassword]=useState(''),[visible,setVisible]=useState(false),[error,setError]=useState('')
 const login=(e:FormEvent)=>{e.preventDefault();if(!validLocalCredentials(user,password)){setError('账号或密码不正确');return}const next:LocalSession={user:'root',createdAt:Date.now()};try{saveLocalSession(sessionStorage,next);sessionStorage.setItem('kuangda-root-login-reset','1')}catch{/* In-memory session remains usable when browser storage is unavailable. */}setSession(next);setPassword('');setVisible(false);setError('')}
 const logout=()=>{try{clearLocalSession(sessionStorage)}catch{}setSession(null);setPassword('');setVisible(false);setError('')}
 if(session)return <LocalAuth.Provider value={{user:session.user,logout}}>{children}</LocalAuth.Provider>
 return <main className="studio local-login"><div className="login-contours" aria-hidden="true">{[0,1,2,3,4,5,6].map(i=><i key={i} style={{width:420+i*125,height:170+i*57}}/>)}</div><section className="login-card"><div className="login-brand"><Mountain size={38}/><h1>矿大</h1></div><form onSubmit={login}><label><span>账号</span><div><UserRound size={17}/><input aria-label="账号" autoComplete="username" autoFocus value={user} onChange={e=>setUser(e.target.value)} required/></div></label><label><span>密码</span><div><LockKeyhole size={17}/><input aria-label="密码" type={visible?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" aria-label={visible?'隐藏密码':'显示密码'} onClick={()=>setVisible(v=>!v)}>{visible?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label><div className="login-error" role="alert">{error}</div><button className="primary login-submit" type="submit">登录<ArrowRight size={17}/></button></form><small className="login-version">V{PRODUCT_VERSION}</small></section></main>
}
