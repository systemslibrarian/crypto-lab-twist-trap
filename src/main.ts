import './styles.css';
import {P,inverse,mod} from './field/fp';
import {Q,A,GENERATOR_X} from './curve/fixtures';
import {rhs,onCurve,ladder} from './curve/montgomery';
import {multiply,type Point} from './curve/weierstrass';
import {toMain} from './curve/maps';
import {rows as realRows} from './real/orders';
import {fromHex,toHex,x25519} from './real/x25519';
import {checkScalar} from './verify/verify';
import type {TwistRow} from './attack/twist';
import type {InvalidRow} from './attack/invalid';

const root=document.querySelector<HTMLElement>('#exhibit')!;
root.innerHTML=`
<section aria-labelledby="intro"><h2 id="intro">The same arithmetic, the wrong group</h2><p>A service holds a secret scalar α and answers your chosen point P with α·P. If it does not check which curve the point belongs to, answers in small subgroups reveal α a little at a time. The toy field and curve are real finite-field arithmetic; the group is deliberately weak for teaching.</p><p class="warn card"><strong>Scope:</strong> This is a static secret, chosen-input service on a 61-bit toy curve. Actual vulnerable systems need an oracle that answers chosen points. We never attack real curves; their panel computes public order facts and runs RFC test vectors. Not production crypto — a teaching demo.</p></section>
<section aria-labelledby="ladder"><h2 id="ladder">1 · One ladder, two curves</h2><p>The x-only Montgomery ladder uses A but not B. A valid x has x³ + Ax² + x as a square in Fₚ. A nonsquare x lies on the quadratic twist; the same ladder still produces an answer. For full-coordinate short-Weierstrass arithmetic, addition uses a but never b — so validation must check the whole curve equation.</p><label for="try-u">Try a canonical u coordinate (2 to p−1)</label><input id="try-u" value="2" inputmode="numeric"><button id="try-u-button">Check and multiply by 7</button><output id="try-u-out" aria-live="polite">p = 2⁶¹−1, A = 1206. Check a coordinate.</output></section>
<section aria-labelledby="twist"><h2 id="twist">2 · Query the quadratic twist</h2><p>With validation ON, the service rejects the first twist point. Turn it OFF to ask five subgroup questions (orders 4, 109, 35,851, 83,357, 1,769,701). Each x-only answer reveals α modulo a factor up to a ± sign. The Chinese remainder theorem combines sign choices; x(c·G) checks candidates against Bob's public key.</p><label for="twist-validation">Validate input before scalar multiplication</label><select id="twist-validation"><option value="on">ON — refuse the twist (default)</option><option value="off">OFF — broken experiment</option></select><button id="twist-run">Run five twist queries</button><button id="twist-cancel" disabled>Cancel</button><output id="twist-out" aria-live="polite">Validation is ON; no queries have run.</output></section>
<section aria-labelledby="invalid"><h2 id="invalid">3 · Change b and recover the full secret</h2><p>On five different curves y² = x³ + ax + b′, point addition still works with the same a. The attacker picks small-order points, gets full-coordinate answers, solves five small logs, and recombines exact residues. This models a static chosen-point oracle, not the original fault-injection route.</p><label for="full-validation">Validate the entire point on the intended curve</label><select id="full-validation"><option value="on">ON — reject b′ (default)</option><option value="off">OFF — broken experiment</option></select><button id="invalid-run">Run five invalid-curve queries</button><button id="invalid-cancel" disabled>Cancel</button><output id="invalid-out" aria-live="polite">Validation is ON; no queries have run.</output></section>
<section aria-labelledby="cofactor"><h2 id="cofactor">4 · An on-curve point can still be too small</h2><p>This curve has order 4q. An exact-order-4 point passes the on-curve check, yet its answer distinguishes α modulo 4 up to sign. Clamp the toy secret to a multiple of 4 and the response is the point at infinity. RFC 7748 X25519 clamps to a multiple of 8 and allows an all-zero-output check; a toy all-zero check alone does not stop the larger-order twist probes above.</p><label for="clamp">Toy scalar handling</label><select id="clamp"><option value="raw">Unclamped — visible cofactor leak</option><option value="clamp">Multiple of 4 — answer is O</option></select><button id="cofactor-run">Send an on-curve order-4 point</button><output id="cofactor-out" aria-live="polite">No cofactor query yet.</output></section>
<section aria-labelledby="real"><h2 id="real">5 · Real curves: public facts, no attack</h2><p>The order of a quadratic twist is 2p + 2 − #E. Compute it from published field p and group order n; the listed small factors are checked by division. The rho-cost estimates below are from SafeCurves, not calculated by this demo. Twist security does not excuse skipping a full-coordinate on-curve check.</p><div class="output" role="region" aria-label="Real curve order table" tabindex="0" style="overflow:auto"><table><thead><tr><th scope="col">Curve</th><th scope="col">Twist order, 2p+2−n</th><th scope="col">Small factors</th><th scope="col">Remaining bits</th><th scope="col">SafeCurves rho estimate</th></tr></thead><tbody id="real-rows"></tbody></table></div><button id="x25519-run">Check RFC 7748 vectors</button><output id="x25519-out" aria-live="polite">Vectors not run in this browser yet.</output><details><summary>Sources and neighbors</summary><ul><li><a href="https://toc.cryptobook.us/">Boneh &amp; Shoup v0.6 §15.3.2, Exercises 15.1, 15.4</a></li><li><a href="https://www.rfc-editor.org/rfc/rfc7748">RFC 7748 §5.2</a></li><li><a href="https://safecurves.cr.yp.to/twist.html">SafeCurves: twist security estimates</a></li><li><a href="https://www.secg.org/sec2-v2.pdf">SEC 2 v2.0: curve orders</a></li><li><a href="https://github.com/systemslibrarian/crypto-lab-point-arithmetic">Point Arithmetic</a></li><li><a href="https://github.com/systemslibrarian/crypto-lab-log-forge">Log Forge</a></li></ul><p>Outside scope: point counting, hardware faults, x-only short-Weierstrass code, and attacks against live endpoints.</p></details></section>`;
const el=(id:string)=>document.getElementById(id)!;
const randomScalar=()=>{const bytes=crypto.getRandomValues(new Uint8Array(8));let n=0n;for(const b of bytes)n=(n<<8n)|BigInt(b);return 2n*(n/2n%((Q-1n)/2n))+1n};
let alpha=randomScalar(),work:{twist:Worker|null;invalid:Worker|null}={twist:null,invalid:null};
const labelPoint=(pt:Point)=>pt?`(${pt.x}, ${pt.y})`:'O';
function retire(id:string){el(id).textContent='Retired: input or validation changed. Run again.';el(id).className=''}
el('try-u-button').addEventListener('click',()=>{
 const raw=(el('try-u') as HTMLInputElement).value;
 if(!/^\d+$/.test(raw)){el('try-u-out').textContent='Refused: enter a canonical nonnegative integer.';return}
 const u=BigInt(raw);if(u>=P){el('try-u-out').textContent=`Refused: u must be < p = ${P}.`;return}
 const main=onCurve(u),answer=ladder(7n,u);
 el('try-u-out').textContent=`u=${u}; u³ + ${A}u² + u ≡ ${rhs(u)} mod p is ${main?'a square: on E':'a nonsquare: on the twist'}. The same ladder computes [7]u = ${answer??'O'}.`;
});
function attack(mode:'twist'|'invalid'){
 const select=el(mode==='twist'?'twist-validation':'full-validation') as HTMLSelectElement;
 const output=el(mode==='twist'?'twist-out':'invalid-out');const button=el(mode==='twist'?'twist-run':'invalid-run') as HTMLButtonElement;
 const cancel=el(mode==='twist'?'twist-cancel':'invalid-cancel') as HTMLButtonElement;
 work[mode]?.terminate();const worker=new Worker(new URL('./worker/attacks.ts',import.meta.url),{type:'module'});work[mode]=worker;
 button.disabled=true;cancel.disabled=false;output.textContent='Computing and proving exact-order points, then asking the five queries…';
 worker.onmessage=(event:MessageEvent<{error?:string;answer?:{rows:(TwistRow|InvalidRow)[];matches?:bigint[];candidates?:bigint[];recovered?:bigint|null};publicKey?:bigint|Point}>)=>{
  if(work[mode]!==worker)return;worker.terminate();work[mode]=null;button.disabled=false;cancel.disabled=true;
  if(event.data.error){output.className=select.value==='on'?'good':'warn';output.textContent=event.data.error.includes('REFUSED')?`REFUSED — ${event.data.error}. The first invalid point was stopped before multiplication.`:`Attack failed: ${event.data.error}`;return}
  const ans=event.data.answer!,found=mode==='twist'?ans.matches?.[0]:ans.recovered;
  const rows=ans.rows.map((row,i)=>mode==='twist'?`${i+1}. order ${row.order}: u ${(row as TwistRow).u} → x ${(row as TwistRow).answer}; α ≡ ±${row.residue} (mod ${row.order})`:`${i+1}. b′=${(row as InvalidRow).b}, order ${row.order}: ${labelPoint((row as InvalidRow).point)} → ${labelPoint((row as InvalidRow).answer)}; α ≡ ${row.residue} (mod ${row.order})`).join('\n');
  const checked=mode==='invalid'?checkScalar(found??0n,event.data.publicKey as Point):found!==undefined&&found!==null&&ladder(found,GENERATOR_X)===event.data.publicKey;
  output.className=checked?'alarm':'warn';output.textContent=`${rows}\nBob's public ${mode==='twist'?`x=${event.data.publicKey}`:`point=${labelPoint(event.data.publicKey as Point)}`}.\n${checked?`ALARM — ${mode==='twist'?'±α, the same x-only key':'α'} recovered from five chosen points: ${found}. Independently checked against Bob's public key.`:'Recovery refused: no independently verified candidate.'}\n${mode==='twist'?`CRT sign combinations considered: ${ans.candidates?.length}; public-key matches: ${ans.matches?.length}.`:''} Honest generic E cost is about √q ≈ 2^29.5 group operations (formula), versus five chosen-point queries here.`;
 };
 worker.onerror=()=>{if(work[mode]===worker){work[mode]=null;button.disabled=false;cancel.disabled=true;output.textContent='Worker failed; no recovery claimed.'}};
 worker.postMessage({mode,alpha,validate:select.value==='on'});
}
for(const mode of ['twist','invalid'] as const){
 el(`${mode}-run`).addEventListener('click',()=>attack(mode));
 el(`${mode}-cancel`).addEventListener('click',()=>{work[mode]?.terminate();work[mode]=null;(el(`${mode}-run`) as HTMLButtonElement).disabled=false;(el(`${mode}-cancel`) as HTMLButtonElement).disabled=true;el(`${mode}-out`).textContent='Cancelled: no partial CRT result is claimed.'});
 el(mode==='twist'?'twist-validation':'full-validation').addEventListener('change',()=>{work[mode]?.terminate();work[mode]=null;(el(`${mode}-run`) as HTMLButtonElement).disabled=false;(el(`${mode}-cancel`) as HTMLButtonElement).disabled=true;retire(`${mode}-out`)});
}
function cofactorPoint():Point {for(let u=2n;u<1000n;u++){if(!onCurve(u))continue;const pt=multiply(Q,toMain(u));if(pt&&multiply(2n,pt))return pt}throw new Error('No order-4 point found')}
el('clamp').addEventListener('change',()=>retire('cofactor-out'));
el('cofactor-run').addEventListener('click',()=>{
 const pt=cofactorPoint()!,u=mod(pt.x-A*inverse(3n)),clamped=(el('clamp') as HTMLSelectElement).value==='clamp';
 const scalar=clamped?alpha-(alpha%4n):alpha,answer=ladder(scalar,u);
 el('cofactor-out').className=answer===null?'good':'alarm';
 el('cofactor-out').textContent=`Input P=${labelPoint(pt)} on E; [4]P=O. The on-curve check passes. ${clamped?'Scalar made a multiple of 4':'Raw scalar used'}. Answer = ${answer??'O'}. ${answer===null?'No subgroup residue in this response.':'ON THE CURVE — AND LEAKING α mod 4 up to sign.'}`;
});
const tbody=el('real-rows');
for(const r of realRows()){
 const tr=document.createElement('tr');
 for(const val of [r.name,String(r.order),r.small.join(' × '),String(r.bits),r.rho]){const td=document.createElement('td');td.textContent=val;td.style.padding='.5rem';td.style.borderBottom='1px solid var(--border)';tr.append(td)}tbody.append(tr);
}
el('x25519-run').addEventListener('click',()=>{
 const s=fromHex('a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4'),u=fromHex('e6db6867583030db3594c1a424b15f7c726624ec26b3353b10a903a6d0ab1c4c');
 const expected='c3da55379de9c6908e94ea4df28d084f32eccf03491c71f754b4075577a28552';
 const actual=toHex(x25519(s,u)),held=actual===expected;el('x25519-out').className=held?'good':'warn';
 el('x25519-out').textContent=`RFC 7748 §5.2 first full 255-step X25519 ladder: expected ${expected}; computed ${actual}. ${held?'MATCH':'MISMATCH'}. The unit suite also runs the second and 1,000-iteration vectors. No real-curve secret was attacked.`;
});
