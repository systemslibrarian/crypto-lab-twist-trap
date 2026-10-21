import {mod,P,squareRoot,inverse} from '../field/fp';
import {A} from './fixtures';
export function rhs(u:bigint):bigint{return mod(u*u*u+A*u*u+u)}
export function canonical(u:bigint):boolean{return u>=0n&&u<P}
export function onCurve(u:bigint):boolean {return canonical(u)&&squareRoot(rhs(u))!==null}
/** x-only Montgomery ladder; the same formulas act on the curve and its quadratic twist. */
export function ladder(scalar:bigint,u:bigint,p=P,a=A):bigint|null{
 if(scalar<0n||u<0n||u>=p)throw new RangeError('Non-canonical u or negative scalar');
 if(scalar===0n)return null;
 let x2=1n,z2=0n,x3=u,z3=1n,swap=0n;
 const a24=mod((a-2n)*inverse(4n,p),p);
 for(let t=scalar.toString(2).length-1;t>=0;t--){
  const k=(scalar>>BigInt(t))&1n;swap^=k;
  if(swap){[x2,x3]=[x3,x2];[z2,z3]=[z3,z2]}
  swap=k;
  const aa=mod(x2+z2,p),bb=mod(x2-z2,p),AA=aa*aa%p,BB=bb*bb%p,E=mod(AA-BB,p);
  const cc=mod(x3+z3,p),dd=mod(x3-z3,p),DA=dd*aa%p,CB=cc*bb%p;
  x3=mod(DA+CB,p)**2n%p;
  z3=u*(mod(DA-CB,p)**2n%p)%p;
  x2=AA*BB%p;
  z2=E*mod(AA+a24*E,p)%p;
 }
 if(swap){[x2,x3]=[x3,x2];[z2,z3]=[z3,z2]}
 return z2===0n?null:x2*inverse(z2,p)%p;
}

