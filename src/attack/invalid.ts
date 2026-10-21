import {INVALID,Q} from '../curve/fixtures';
import {multiply,type Point} from '../curve/weierstrass';
import {bsgs} from '../dlog/bsgs';
import {combine} from '../nt/crt';
import {invalidPoint} from './points';
import {mainGenerator} from '../curve/maps';
export type InvalidRow={b:bigint;order:bigint;point:Point;answer:Point;residue:bigint;tried:number};
export function invalidAttack(query:(p:Point)=>Point,publicKey:Point):{rows:InvalidRow[];recovered:bigint|null}{
 const rows:InvalidRow[]=[];
 for(const entry of INVALID){
  const fixture=invalidPoint(entry),answer=query(fixture.point);
  if(!answer)throw new Error('Infinity: no discrete log information for this point');
  const residue=bsgs(fixture.point,answer,entry.l);
  if(residue===null)throw new Error('Small-subgroup log failed');
  rows.push({b:entry.b,order:entry.l,point:fixture.point,answer,residue,tried:fixture.tried});
 }
 const value=combine(rows.map(r=>r.residue),rows.map(r=>r.order)).value;
 const computed=multiply(value,mainGenerator());
 const verified=value<Q&&publicKey&&computed&&computed.x===publicKey.x&&computed.y===publicKey.y;
 return {rows,recovered:verified?value:null};
}

