/** Keep a card's fallback action separate from its own controls and 3D gestures. */
export const widgetControlSelector='button,a,input,select,textarea,summary,[role="button"],[role="link"],[data-widget-interactive],canvas'
export function isWidgetClick(start:{x:number;y:number}|null,end:{x:number;y:number},nested:boolean){
 return !nested&&(!start||Math.hypot(end.x-start.x,end.y-start.y)<=6)
}
