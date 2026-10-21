import {add,multiply,negate,type Point} from '../curve/weierstrass';
export function bsgs(base:Point,result:Point,order:bigint):bigint|null{
 if(!base||!result||order<2n||order>2000000n)throw new RangeError('Only fixture subgroup orders up to two million');
 const m=BigInt(Math.ceil(Math.sqrt(Number(order)))),lookup=new Map<string,bigint>();
 let b:Point=null;for(let j=0n;j<m;j++){lookup.set(b?`${b.x}:${b.y}`:'O',j);b=add(b,base)}
 const stride=negate(multiply(m,base));let target:Point=result;
 for(let i=0n;i<=m;i++){const j=lookup.get(target?`${target.x}:${target.y}`:'O');if(j!==undefined)return (i*m+j)%order;target=add(target,stride)}
 return null;
}

