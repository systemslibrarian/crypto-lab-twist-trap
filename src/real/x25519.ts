import {ladder} from '../curve/montgomery';
const P255=(1n<<255n)-19n;
export const fromHex=(hex:string):Uint8Array=>Uint8Array.from(hex.match(/../g)!.map(x=>parseInt(x,16)));
export const toHex=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export function decodeLE(bytes:Uint8Array):bigint{let n=0n;for(let i=bytes.length-1;i>=0;i--)n=(n<<8n)|BigInt(bytes[i]);return n}
export function encodeLE(n:bigint):Uint8Array{const out=new Uint8Array(32);for(let i=0;i<32;i++){out[i]=Number(n&255n);n>>=8n}return out}
export function x25519(scalar:Uint8Array,point:Uint8Array):Uint8Array{
 if(scalar.length!==32||point.length!==32)throw new RangeError('X25519 requires two 32-byte inputs');
 const k=scalar.slice();k[0]&=248;k[31]&=127;k[31]|=64;
 const u=point.slice();u[31]&=127;
 return encodeLE(ladder(decodeLE(k),decodeLE(u)%P255,P255,486662n)??0n);
}

