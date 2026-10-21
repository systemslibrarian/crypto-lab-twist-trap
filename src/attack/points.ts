import {P,mod,inverse} from '../field/fp';
import {A,TWIST,INVALID} from '../curve/fixtures';
import {rhs} from '../curve/montgomery';
import {toTwist} from '../curve/maps';
import {point,multiply,type Point} from '../curve/weierstrass';
export function twistPoint(order:bigint):{u:bigint;point:Point;tried:number}{
 for(let candidate=2n;candidate<10000n;candidate++){
  if(rhs(candidate)===0n)continue;
  const original=toTwist(candidate);if(!original)continue;
  const small=multiply(TWIST/order,original);
  if(!small||multiply(order,small)!==null)continue;
  if(order===4n&&multiply(2n,small)===null)continue;
  const u=mod(-small.x-A*inverse(3n));
  if(u<P&&toTwist(u))return {u,point:small,tried:Number(candidate-1n)};
 }
 throw new Error(`Could not find a twist point of exact order ${order}`);
}
export function invalidPoint(entry:typeof INVALID[number]):{point:Point;tried:number}{
 for(let x=1n;x<10000n;x++){
  const original=point(x,entry.b);if(!original)continue;
  const small=multiply(entry.order/entry.l,original);
  if(small&&multiply(entry.l,small)===null&&small.x<P&&small.y<P)return {point:small,tried:Number(x)};
 }
 throw new Error(`No exact-order point on b'=${entry.b}`);
}
// [extension] point: fixture search can be replaced by published point fixtures if independently verified.

