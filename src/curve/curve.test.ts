import {describe,it,expect} from 'vitest';
import {P,isPrime,mod,inverse} from '../field/fp';
import {A,Q,ORDER,TWIST,TWIST_FACTORS,GENERATOR_X,INVALID,B_SHORT} from './fixtures';
import {mainGenerator,toMain,toTwist,toMont} from './maps';
import {ladder,onCurve,rhs} from './montgomery';
import {multiply,onCurve as fullCurve,type Point} from './weierstrass';
import {twistPoint,invalidPoint} from '../attack/points';
import {XService} from '../service/xonly';
import {FullService} from '../service/full';
import {twistAttack} from '../attack/twist';
import {invalidAttack} from '../attack/invalid';
import {checkScalar} from '../verify/verify';

describe('proven toy curve facts',()=>{
 it('proves field, main subgroup, twist factors, and map identities',()=>{
  expect(isPrime(P)).toBe(true);expect(isPrime(Q)).toBe(true);
  expect(TWIST).toBe(2n*P+2n-ORDER);
  expect(TWIST_FACTORS.reduce((a,b)=>a*b,1n)).toBe(TWIST);
  for(const factor of TWIST_FACTORS.slice(1))expect(isPrime(factor)).toBe(true);
  expect(onCurve(GENERATOR_X)).toBe(true);
  expect(mainGenerator()).not.toBeNull();expect(multiply(Q,mainGenerator())).toBeNull();
  expect(ladder(Q,GENERATOR_X)).toBeNull();
  expect(fullCurve(toMain(GENERATOR_X),B_SHORT)).toBe(true);
  for(const u of [2n,3n,23n,91n])if(!onCurve(u)&&rhs(u)!==0n)expect(toTwist(u)).not.toBeNull();
  const sample=twistPoint(109n);
  for(let n=1n;n<=10n;n++)expect(ladder(n,sample.u),`twist scalar ${n}`).toBe(toMont(multiply(n,sample.point),true));
 });
 it('exhibits exact-order twist and invalid-curve subgroup points',()=>{
  for(const order of TWIST_FACTORS){const fixture=twistPoint(order);expect(fixture.point).not.toBeNull();expect(multiply(order,fixture.point)).toBeNull();expect(onCurve(fixture.u)).toBe(false)}
  for(const entry of INVALID){const fixture=invalidPoint(entry);expect(multiply(entry.l,fixture.point)).toBeNull();expect(fullCurve(fixture.point,entry.b)).toBe(true);expect(fullCurve(fixture.point,B_SHORT)).toBe(false)}
 });
});
describe('real invalid-input attacks and defenses',()=>{
 it('rejects a twist point by default, then recovers ±alpha with five x-only queries',()=>{
  const alpha=123456789n,held=new XService(alpha),broken=new XService(alpha,false);
  expect(()=>twistAttack(u=>held.query(u),held.publicKey)).toThrow(/REFUSED/);
  const attacked=twistAttack(u=>broken.query(u),broken.publicKey);
  expect(attacked.rows).toHaveLength(5);
  expect(attacked.matches).toContain(alpha);
 });
 it('rejects an invalid curve by default, then recovers alpha with five full-coordinate queries',()=>{
  const alpha=987654321n,held=new FullService(alpha),broken=new FullService(alpha,false);
  expect(()=>invalidAttack(p=>held.query(p),held.publicKey)).toThrow(/REFUSED/);
  const attacked=invalidAttack(p=>broken.query(p),broken.publicKey);
  expect(attacked.rows).toHaveLength(5);expect(attacked.recovered).toBe(alpha);
  expect(checkScalar(attacked.recovered!,held.publicKey)).toBe(true);
 });
 it('a canonical on-curve order-four point passes validation but reveals residue without clamping',()=>{
  // q*R is order 4 for an R with a nonzero cofactor component.
  let low:Point=null;for(let u=2n;u<100n;u++)if(onCurve(u)){const candidate=multiply(Q,toMain(u));if(candidate&&multiply(2n,candidate)!==null){low=candidate;break}}
  expect(low).not.toBeNull();const u=mod(low!.x-A*inverse(3n));
  const raw=new XService(123456789n);expect(raw.query(u)).not.toBeNull();
  const clamped=new XService(123456788n);expect(clamped.query(u)).toBeNull();
 });
});
