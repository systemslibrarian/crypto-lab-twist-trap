import {mod,inverse,squareRoot} from '../field/fp';
import {A_SHORT} from './fixtures';
export type Point={x:bigint;y:bigint}|null;
export function curveValue(x:bigint,b:bigint):bigint{return mod(x*x*x+A_SHORT*x+b)}
export function point(x:bigint,b:bigint):Point{const y=squareRoot(curveValue(x,b));return y===null?null:{x,y}}
export function onCurve(pt:Point,b:bigint):boolean{return pt===null||mod(pt.y*pt.y)===curveValue(pt.x,b)}
export function negate(pt:Point):Point{return pt&&{x:pt.x,y:mod(-pt.y)}}
/** The group law uses a but not b; omitting curve validation makes it act on every b′. */
export function add(p:Point,q:Point):Point{
 if(!p)return q;if(!q)return p;
 if(p.x===q.x&&mod(p.y+q.y)===0n)return null;
 let m:bigint;
 if(p.x===q.x&&p.y===q.y){if(p.y===0n)return null;m=mod((3n*p.x*p.x+A_SHORT)*inverse(2n*p.y))}
 else m=mod((q.y-p.y)*inverse(q.x-p.x));
 const x=mod(m*m-p.x-q.x);return {x,y:mod(m*(p.x-x)-p.y)};
}
export function multiply(n:bigint,p:Point):Point{
 if(n<0n)return multiply(-n,negate(p));let r:Point=null,q=p;
 for(;n>0n;n>>=1n,q=add(q,q))if(n&1n)r=add(r,q);
 return r;
}
// [extension] point: an x-only Weierstrass ladder can also traverse a weak twist.

