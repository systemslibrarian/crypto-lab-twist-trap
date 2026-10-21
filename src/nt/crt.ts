import {mod,inverse} from '../field/fp';
export function combine(residues:readonly bigint[],moduli:readonly bigint[]):{value:bigint;modulus:bigint}{
 if(residues.length!==moduli.length||!moduli.length)throw new RangeError('CRT inputs must align');
 let value=0n,product=1n;
 for(let i=0;i<residues.length;i++){
  const n=moduli[i],step=mod((residues[i]-value)*inverse(product%n,n),n);
  value+=product*step;product*=n;
 }
 return {value,modulus:product};
}

