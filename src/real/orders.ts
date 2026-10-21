const p256P=BigInt('0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff');
const p256N=BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551');
const k1P=BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f');
const k1N=BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141');
const cP=(1n<<255n)-19n,cN=8n*((1n<<252n)+27742317777372353535851937790883648493n);
export const REAL=[
 {name:'P-256',p:p256P,n:p256N,small:[3n,5n,13n,179n],rho:'≈ 2^120.3'},
 {name:'secp256k1',p:k1P,n:k1N,small:[3n,3n,13n,13n,3319n,22639n],rho:'≈ 2^109.5'},
 {name:'Curve25519',p:cP,n:cN,small:[2n,2n],rho:'≈ 2^126.3'},
] as const;
export function rows(){return REAL.map(r=>{const order=2n*r.p+2n-r.n,divisor=r.small.reduce((x,y)=>x*y,1n);return {...r,order,cofactor:order/divisor,divisible:order%divisor===0n,bits:(order/divisor).toString(2).length}})}
// [extension] point: add brainpoolP256r1 and Curve448 with reviewed source constants.

