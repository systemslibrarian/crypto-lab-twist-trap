import {describe,it,expect} from 'vitest';
import {fromHex,toHex,x25519} from './x25519';
import {rows} from './orders';

describe('RFC 7748 §5.2 vectors through this lab’s ladder',()=>{
 it('matches both X25519 scalar multiplication vectors',()=>{
  const tests=[
   ['a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4','e6db6867583030db3594c1a424b15f7c726624ec26b3353b10a903a6d0ab1c4c','c3da55379de9c6908e94ea4df28d084f32eccf03491c71f754b4075577a28552'],
   ['4b66e9d4d1b4673c5ad22691957d6af5c11b6421e0ea01d42ca4169e7918ba0d','e5210f12786811d3f4b7959d0538ae2c31dbe7106fc03c3efc4cd549c715a493','95cbde9476e8907d7aade45cb4b873f88b595a68799fa152e6f8f7647aac7957'],
  ];
  for(const [s,u,expected] of tests)expect(toHex(x25519(fromHex(s),fromHex(u)))).toBe(expected);
 });
 it('matches the iterated one and 1000 results',()=>{
  let k:Uint8Array=fromHex('09'+'00'.repeat(31)),u:Uint8Array=k.slice();
  for(let i=1;i<=1000;i++){
   const old=k;k=x25519(k,u);u=old;
   if(i===1)expect(toHex(k)).toBe('422c8e7a6227d7bca1350b3e2bb7279f7897b87bb6854b783c60e80311ae3079');
  }
  expect(toHex(k)).toBe('684cf59ba83309552800ef566f2f4d3c1c3887c49360e3875f2eb94d99532c51');
 });
 it('computes three real-curve twist orders from published p and n',()=>{
  const [p256,k1,c]=rows();
  expect(p256.divisible&&k1.divisible&&c.divisible).toBe(true);
  expect(c.cofactor).toBe((1n<<253n)-55484635554744707071703875581767296995n);
 });
});
