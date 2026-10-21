export const P=(1n<<61n)-1n;
export function mod(n:bigint,p=P):bigint{const x=n%p;return x<0n?x+p:x}
export function pow(a:bigint,n:bigint,p=P):bigint{let x=mod(a,p),r=1n;for(;n>0n;n>>=1n,x=x*x%p)if(n&1n)r=r*x%p;return r}
export function inverse(x:bigint,p=P):bigint {if(mod(x,p)===0n)throw new RangeError('Zero has no inverse');return pow(x,p-2n,p)}
export function squareRoot(n:bigint):bigint|null {n=mod(n);if(n===0n)return 0n;const r=pow(n,(P+1n)/4n);return mod(r*r)===n?r:null}
export function isPrime(n:bigint):boolean {
 if(n<2n)return false;
 for(const small of [2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n]){if(n===small)return true;if(n%small===0n)return false}
 let d=n-1n,s=0;while((d&1n)===0n){d>>=1n;s++}
 for(const a of [2n,325n,9375n,28178n,450775n,9780504n,1795265022n]){
  if(a%n===0n)continue;let x=pow(a,d,n);if(x===1n||x===n-1n)continue;
  let witness=true;for(let i=1;i<s;i++){x=x*x%n;if(x===n-1n){witness=false;break}}
  if(witness)return false;
 }
 return true;
}

