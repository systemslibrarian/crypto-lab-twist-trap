import {P,mod,pow} from '../field/fp';
import {A,GENERATOR_X,A_SHORT,B_SHORT} from '../curve/fixtures';
import type {Point} from '../curve/weierstrass';
/** Independent double-and-add implementation; imports neither curve nor attack arithmetic. */
export function checkScalar(s:bigint,pub:Point):boolean{
 if(!pub)return false;
 const shifted=mod(GENERATOR_X+A*pow(3n,P-2n));
 const right=mod(shifted**3n+A_SHORT*shifted+B_SHORT);
 const y=pow(right,(P+1n)/4n);
 if(mod(y*y)!==right)return false;
 type Local={x:bigint;y:bigint}|null;
 const plus=(u:Local,v:Local):Local=>{
  if(!u)return v;if(!v)return u;
  if(u.x===v.x&&mod(u.y+v.y)===0n)return null;
  const slope=u.x===v.x?mod((3n*u.x*u.x+A_SHORT)*pow(2n*u.y,P-2n)):mod((v.y-u.y)*pow(mod(v.x-u.x),P-2n));
  const x=mod(slope*slope-u.x-v.x);return {x,y:mod(slope*(u.x-x)-u.y)};
 };
 let base:Local={x:shifted,y},out:Local=null;
 for(;s>0n;s>>=1n,base=plus(base,base))if(s&1n)out=plus(out,base);
 return !!out&&out.x===pub.x&&(out.y===pub.y||mod(-out.y)===pub.y);
}
