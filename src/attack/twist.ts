import {TWIST_FACTORS,GENERATOR_X,Q} from '../curve/fixtures';
import {ladder} from '../curve/montgomery';
import {toTwist} from '../curve/maps';
import {bsgs} from '../dlog/bsgs';
import {combine} from '../nt/crt';
import {twistPoint} from './points';
import {mod} from '../field/fp';
export type TwistRow={order:bigint;u:bigint;answer:bigint;residue:bigint;tried:number};
/** Only a query oracle and its public key are visible here. */
export function twistAttack(query:(u:bigint)=>bigint|null,publicX:bigint):{rows:TwistRow[];candidates:bigint[];matches:bigint[]}{
 const rows:TwistRow[]=[];
 for(const order of TWIST_FACTORS){
  const fixture=twistPoint(order),answer=query(fixture.u);
  if(answer===null)throw new Error('Infinity: no discrete log information for this point');
  const result=toTwist(answer);
  if(!result)throw new Error('Answer was not a point on the twist');
  const residue=bsgs(fixture.point,result,order);
  if(residue===null)throw new Error(`Small-subgroup log failed for order ${order}, input ${fixture.u}, output ${answer}`);
  rows.push({order,u:fixture.u,answer,residue,tried:fixture.tried});
 }
 let selections:bigint[][]=[[]];
 for(const row of rows){const options=[row.residue,mod(-row.residue,row.order)];
   selections=selections.flatMap(prev=>[...new Set(options.map(String))].map(s=>[...prev,BigInt(s)]));
 }
 const candidates=[...new Set(selections.map(s=>combine(s,rows.map(r=>r.order)).value.toString()))].map(BigInt);
 const matches=candidates.filter(c=>c>0n&&c<Q&&ladder(c,GENERATOR_X)===publicX);
 return {rows,candidates,matches};
}

