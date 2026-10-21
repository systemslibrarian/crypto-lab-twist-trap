import {test,expect} from '@playwright/test';
const p=(1n<<61n)-1n,A=1206n,g=2070064602348809406n;
const mod=(n:bigint)=>((n%p)+p)%p;
const power=(n:bigint,e:bigint)=>{let x=mod(n),r=1n;for(;e>0n;e>>=1n,x=x*x%p)if(e&1n)r=r*x%p;return r};
/** Separate ladder implementation for rendered recovered scalar; no src import. */
function ladder(k:bigint,u:bigint):bigint|null{
 let x=1n,z=0n,X=u,Z=1n,flip=0n;
 for(let i=k.toString(2).length-1;i>=0;i--){const bit=k>>BigInt(i)&1n;flip^=bit;if(flip){[x,X]=[X,x];[z,Z]=[Z,z]}flip=bit;
  const a=mod(x+z),b=mod(x-z),c=mod(X+Z),d=mod(X-Z),aa=a*a%p,bb=b*b%p,diff=mod(aa-bb),da=d*a%p,cb=c*b%p;
  X=mod(da+cb)**2n%p;Z=u*(mod(da-cb)**2n%p)%p;
  x=aa*bb%p;z=diff*mod(aa+mod((A-2n)*power(4n,p-2n))*diff)%p;
 }
 if(flip){[x,X]=[X,x];[z,Z]=[Z,z]}
 return z===0n?null:x*power(z,p-2n)%p;
}
test('rendered twist residues and recovered scalar independently match the public x',async({page})=>{
 await page.goto('./');await page.locator('#twist-validation').selectOption('off');
 await page.getByRole('button',{name:'Run five twist queries'}).click();const out=page.locator('#twist-out');await expect(out).toContainText('ALARM',{timeout:45000});
 const text=await out.innerText(),rows=[...text.matchAll(/order (\d+): u (\d+) → x (\d+); α ≡ ±(\d+) \(mod (\d+)\)/g)];expect(rows).toHaveLength(5);
 const recovered=BigInt(text.match(/points: (\d+)\. Independently/)![1]);
 for(const row of rows){const order=BigInt(row[1]),u=BigInt(row[2]),answer=BigInt(row[3]),residue=BigInt(row[4]);
  expect(ladder(recovered,u)).toBe(answer);
  expect([residue,(order-residue)%order]).toContain(recovered%order);
 }
 const publicX=BigInt(text.match(/Bob's public x=(\d+)/)![1]);expect(ladder(recovered,g)).toBe(publicX);
 await page.locator('#twist-validation').selectOption('on');await expect(out).toContainText('Retired');
 await page.getByRole('button',{name:'Send an on-curve order-4 point'}).click();await expect(page.locator('#cofactor-out')).toContainText('ON THE CURVE — AND LEAKING');
});
