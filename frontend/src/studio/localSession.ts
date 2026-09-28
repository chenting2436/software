// Local presentation entry only. This is not a server-side authorization boundary.
export const LOCAL_SESSION_KEY='kuangda-local-session-v1'
export const PRODUCT_VERSION='2.4.4'
export type LocalSession={user:'root';createdAt:number}
export function validLocalCredentials(user:string,password:string){return user.trim()==='root'&&password==='root'}
export function readLocalSession(storage:Pick<Storage,'getItem'>):LocalSession|null{
 try{const s=JSON.parse(storage.getItem(LOCAL_SESSION_KEY)||'null');return s?.user==='root'&&Number.isFinite(s.createdAt)?s:null}catch{return null}
}
export function saveLocalSession(storage:Pick<Storage,'setItem'>,session:LocalSession){storage.setItem(LOCAL_SESSION_KEY,JSON.stringify(session))}
export function clearLocalSession(storage:Pick<Storage,'removeItem'>){storage.removeItem(LOCAL_SESSION_KEY)}
