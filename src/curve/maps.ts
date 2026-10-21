import {mod,inverse} from '../field/fp';
import {A,B_SHORT,GENERATOR_X} from './fixtures';
import {point,type Point} from './weierstrass';
import {rhs} from './montgomery';
const shift=mod(A*inverse(3n));
export const toMain=(u:bigint):Point=>point(mod(u+shift),B_SHORT);
export const toTwist=(u:bigint):Point=>point(mod(-u-shift),mod(-B_SHORT));
export const toMont=(p:Point,twist=false):bigint|null=>p?mod((twist?-p.x:p.x)-shift):null;
export const mainGenerator=():Point=>toMain(GENERATOR_X);
export function twistCoordinate(u:bigint):boolean{return toTwist(u)!==null&&rhs(u)!==0n}

