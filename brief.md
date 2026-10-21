# Build brief — `crypto-lab-twist-trap`

**2026-10-20. Brief only; no repository exists yet.** Written against
`audits/_MASTER-TEMPLATE.md` (catalog `20cb434d89e4`) — §0 through §6 apply unchanged.
Source of the gap: Boneh–Shoup v0.6 §15.3.2 ("A security twist"), Exercise 15.1 (invalid-curve
attack on EC ElGamal), Exercises 15.2 and 15.4 (x-only ladders), Remark 12.1 (group membership
verification) and §16.1.2 (discrete log in composite-order groups).

**Verdict: new repository.**

```
NEW DEMO BRIEF
- Repo name:         crypto-lab-twist-trap
- Short name (H1):   Twist Trap
- Subtitle:          Invalid-curve and twist attacks · point validation · twist security
- One-liner:         A key holder answers "α·P" for points you send. Skip the check that P is
                     on the right curve and five answers — from points on the quadratic twist,
                     or on curves with a different b — give α mod small primes, and CRT
                     reassembles the whole key; then the same arithmetic on X25519, P-256 and
                     secp256k1.
- Concept to teach:  Elliptic-curve formulas never look at every curve coefficient, so "a point"
                     is only a point on YOUR curve if you check. Point validation is the
                     implementation's defence; twist security is the curve designer's defence
                     for x-only code; neither replaces the other.
- Primitives/spec:   B–S v0.6 §15.3.2, Ex. 15.1/15.2/15.4, Remark 12.1, §16.1.2; RFC 7748
                     (X25519 ladder, clamping, §6.1 all-zero check); SEC 2 v2.0 (P-256 as
                     secp256r1, secp256k1); Biehl–Meyer–Müller CRYPTO 2000; Jager–Schwenk–
                     Somorovsky ESORICS 2015; Biham–Neumann SAC 2019 (CVE-2018-5383);
                     SafeCurves "twist" page
- Accent (--accent): [central assignment]
- Favicon emoji:     [central assignment]
- Category:          [central assignment]
- Level (suggested): Advanced (Act 0 readable by an Intermediate learner)
- Section (suggested): cryptanalysis
- In scope:          a toy Montgomery curve over p = 2^61 − 1 with prime-order main subgroup and
                     a smooth quadratic twist (fixture below); an x-only static-DH service
                     (RFC 7748-style ladder) and a full-coordinate static-DH service, each with a
                     validation toggle; the twist attack; the invalid-curve attack; the
                     cofactor leak; a real-curve panel (twist orders of P-256, secp256k1,
                     Curve25519, and the same ladder running RFC 7748's X25519 vectors)
- Non-goals:         point counting (the toy curves are a verified fixture); attacking any real
                     curve; fault injection (Biehl–Meyer–Müller's original setting — prose
                     only); Brier–Joye / Weierstrass x-only ladders (extension seam); Lim–Lee
                     small-subgroup attacks in Z*_p (link Log Forge)
```

## Overlap check — what I read, and what I found

Searched every clone in `/home/claude/labs` (`*.ts *.html *.md *.js`, excluding node_modules,
.git, dist) for `invalid.?curve|twist (attack|security|secure)|quadratic twist|small.?subgroup
(attack|confinement)|low.?order point|point validation|validate.{0,20}point|lim.?lee`,
excluding "twisted Edwards". Hits inspected (commit pinned):

- **PSI Gate** (`f4c3181c83ba`) `src/attacks.ts:194–260`, "Attack 4 — Malformed / Low-Order Point
  Injection". It feeds the identity, a non-canonical encoding and random bytes into the real
  receive path (`bobRound2`) and shows ristretto255 rejecting them; low-order torsion leaking bits
  of α is named **in a comment only** (`:246`), because ristretto255 has prime order. No key is
  recovered. Twist Trap is the attack PSI Gate's design prevents — cross-link both ways.
- **OT Gate** README "What Can Go Wrong" (~line 42): a low-order point substituted for A, in prose.
- **Pairing Gate** README (~line 32): subgroup-membership checks for G1/G2, in prose.
- **SM2 Forge** brief/README: point validation on decrypt as an edge-case rule.
- **Key Exchange** (`88e5a0a1a268`) README line 26: "Skipping point/parameter validation invites
  small-subgroup and invalid-curve attacks that can leak the private key." Prose; this lab is that
  sentence executed.
- **Isogeny Gate** `src/graph.ts:6`, `src/csidh.ts:53`: quadratic twists as isogeny-graph
  vertices. Unrelated mechanism.
- **Curve448** (`a17f11bfd919`) `src/main.ts:218`: the clamp box ("Clearing the two low bits
  forces the scalar to a multiple of the cofactor") — the cofactor defence this lab's Act 4 shows
  failing when absent. Link.
- **Curve Lens** (`af90e0db7a4c`) `src/realcurve.ts:101–170`: real-curve parameters and cofactors
  (P-256, Curve25519, secp256k1, brainpoolP256r1); no twist orders, no validation attacks. Link for
  the curves themselves.
- **Log Forge** (`2b5ade3940e3`, in-flight Katz–Lindell lab): `src/group/zp.ts` `member()` refuses
  h ∉ ⟨g⟩ — the Z*_p analogue of point validation — and `src/dlog/pohlig.ts` is a generic
  Pohlig–Hellman over its `Group<T>` interface (`src/group/types.ts`). Link it as "the same
  CRT-on-small-factors arithmetic, when the group itself is weak".

No inspected lab recovers a key through an invalid-curve or twist point. The agent re-runs the
grep before building and reports anything new.

**Code reuse decision.** Log Forge and ZK Arena are MIT-licensed (`LICENSE`, Paul Clark 2026).
Twist Trap needs only a small BSGS and a CRT; either write them, or copy Log Forge's
`src/dlog/generic/bsgs.ts` and `crt()` from `src/nt/modarith.ts` **with an attribution comment
naming the repo and commit**. Do not import across repos.

## The verified fixture (computed for this brief; the agent re-proves it in tests)

Found with PARI/GP `ellcard` (SEA point counting) and re-checked with an independent Python x-only
ladder in this session.

- Field: p = 2^61 − 1 (prime; p ≡ 3 mod 4, so −1 is a non-residue and √v = v^((p+1)/4)).
- Montgomery curve E: y² = x³ + A·x² + x, **A = 1206** (B = 1). Ladder constant a24 = (A − 2)/4 mod p.
- #E = 4·q, **q = 576460752063358913** (prime, 59 bits).
- Quadratic twist: #Ẽ = 2p + 2 − #E = **2305843010173952252 = 4 · 109 · 35851 · 83357 · 1769701**
  (all prime; the twist group is cyclic — the lcm of random point orders equals #Ẽ).
- Generator: take the smallest u ≥ 2 with u³ + A·u² + u a nonzero square, R the point with that
  x, G = 4·R. This gives u = 2 and **x(G) = 2070064602348809406**, of order q.
- Short-Weierstrass model of the same curve (x_W = x_M + A/3): y² = x³ + a·x + b with
  **a = 2305843009213209140, b = 129929214**; #E_W = 4q.
- Quadratic twist in Weierstrass form, for the attacker's own arithmetic: E^(−1): y² = x³ + a·x − b,
  reached from a twist x-coordinate u by x ↦ −(u + A/3).
- Invalid curves y² = x³ + a·x + b′ for the full-coordinate attack (b′, its order, the prime ℓ
  whose subgroup is used):
  - b′ = 2: 2305843011304254754 = 2·1439·35117·22815055979 → ℓ = 35117
  - b′ = 3: 2305843008483712824 = 2³·3²·7·1783·6827·375852941 → ℓ = 6827
  - b′ = 6: 2305843009848393915 = 3·5·43·137·11597·22541·99823 → ℓ = 99823
  - b′ = 8: 2305843011459074031 = 3·7²·17²·3457·15700561301 → ℓ = 3457
  - b′ = 9: 2305843007436886000 = 2⁴·5³·37·1129741·27581579 → ℓ = 1129741
  - The five ℓ multiply to a 77-bit number > q.
- Simulated end to end in Python: five x-only queries to twist points of orders 4, 109, 35851,
  83357, 1769701 give α mod each up to sign; the 2⁵ sign choices collapse to 16 candidates mod q;
  exactly one matches the public key x(α·G) (it is ±α — see invariant 6).

## The seven §1 sections

### SCOPE

0. **What is this.** Plain language: Bob keeps a secret number and will multiply any point you
   send him by it. If he doesn't check that your point is on his curve, your point can live on a
   different, much weaker curve — and his answer tells you a piece of his secret.
1. **The curve that wasn't checked.** Show the formulas. The Montgomery ladder (B–S Ex. 15.4,
   RFC 7748 §5) uses A but never B; the short-Weierstrass addition law (B–S §15.2) uses a but never
   b. So the same code computes on E, on its twist, and on every curve y² = x³ + a·x + b′. A live
   check: pick an x; the page says whether x³ + A·x² + x is a square (on E) or not (on the twist),
   and runs the same ladder either way.
2. **The twist attack (headline mechanism).** Bob's x-only service: input u, output x(α·P)
   (`validate input` toggle, default ON = Euler's criterion on u³ + A·u² + u). Turn validation OFF
   (marked broken). The attacker, for each prime power of #Ẽ (4, 109, 35851, 83357, 1769701):
   picks a twist point, multiplies by #Ẽ/ℓ to get a point of order ℓ, sends it, receives
   x(α·P_ℓ), and solves the small log by BSGS on E^(−1) with full coordinates → α ≡ ±k (mod ℓ).
   Then CRT over the sign choices; each candidate c is tested by x(c·G) = Bob's public key. Show
   the query count (5) beside the generic cost on E (√q ≈ 2^29.5 group operations, as a labelled
   formula). Turn validation ON: the first twist point is refused and nothing leaks.
3. **The invalid-curve attack.** Bob's full-coordinate service: input (x, y), output α·V
   (`validate on-curve` toggle, default ON = check y² = x³ + a·x + b). OFF (marked broken): the
   attacker sends a point of order ℓ on each fixture curve b′, reads α·V, solves the log exactly
   (no sign ambiguity with full coordinates), and CRTs the five residues to α; verified by α·G.
   This is B–S Exercise 15.1's mechanism. (The exercise reaches α·V through ElGamal decryption
   queries and needs up to ℓ queries per prime; here Bob answers α·V directly, as in §15.3.2's
   static-DH framing, so one query per prime suffices — say so on the page.) Invalid-curve attacks
   were introduced by Biehl–Meyer–Müller (CRYPTO 2000) and shown practical against TLS-ECDH by
   Jager–Schwenk–Somorovsky (ESORICS 2015). A prose card on
   Bluetooth's "fixed coordinate" variant (Biham–Neumann; CVE-2018-5383): set y = 0, leave x, and
   the key becomes a point of order two (50% success per pairing for the fully active variant,
   25% semi-passive, per the paper).
4. **The cofactor leak.** #E = 4q, so E itself has points of order 2 and 4. With validation ON,
   send an order-4 point of E: it passes the on-curve check, and the answer reveals α mod 4 up to
   sign. Show RFC 7748's two answers: clamping (decodeScalar25519 makes the scalar a multiple of
   the cofactor 8) and the optional all-zero output check (§6.1). Offer a "clamp α to a multiple
   of 4" toggle on the toy and show the leak vanish.
5. **Real curves, same arithmetic.**
   - Compute the twist order 2p + 2 − n for P-256 (secp256r1) and secp256k1 from SEC 2 v2.0's
     p and n, and for Curve25519 from RFC 7748 §4.1 (n = 8·ℓ). Trial-divide the small factors in
     a worker and show the results:
     - P-256: 3·5·13·179·(241-bit prime) — B–S §15.3.2 says 34905 = 3·5·13·179 divides it;
     - secp256k1: 3²·13²·3319·22639·(220-bit prime) — as B–S states;
     - Curve25519: 4·ℓ′ with ℓ′ = 2^253 − 55484635554744707071703875581767296995 (prime), as on
       SafeCurves.
   - The honest nuance, on screen: SafeCurves lists twist rho costs of about 2^120.3 (P-256),
     2^109.5 (secp256k1) and 2^126.3 (Curve25519), all above its 2^100 bar. P-256's and
     secp256k1's twists are weaker than the curves themselves — B–S: about 187 and 2^18 times
     easier — "but not a significant enough concern to disqualify" them. The real danger is
     x-only code on a curve whose twist is far weaker than this, and full-coordinate code that
     skips validation, which twist security does not help at all.
   - Run the lab's own ladder at p = 2^255 − 19 on RFC 7748 §5.2's two X25519 vectors and the
     1- and 1,000-iteration results, so the toy ladder is visibly the real one. Then send a
     Curve25519 twist point of order 4 to that ladder with a clamped scalar: the result is the
     point at infinity (all-zero output), so nothing leaks.

Non-goal notes in-page, one line each:
- Point counting: "the toy curves are a fixture, proven in tests".
- Faults: "the original invalid-curve attack induced the wrong curve with hardware faults — not
  shown".
- Weierstrass x-only (Brier–Joye): "the same twist issue for short-Weierstrass x-only code —
  future extension".

### SECURITY / CORRECTNESS INVARIANTS

1. **Validation defaults ON** in both services. The OFF paths live in `src/attack/` modules, are
   never the default, and are visibly marked broken whenever active.
2. **Bob's secret never reaches the attacker code.** `src/attack/*` receives only the services'
   outputs and the public key. An import-list test enforces that it cannot read α.
3. **Every recovered key is verified** by an independent scalar multiplication in
   `src/verify/verify.ts`, which imports nothing from `src/curve/` or `src/attack/` (Log Forge's
   and Factor Forge's isolation rule).
4. **Every small-order point is proven** to have exact order ℓ (P ≠ O, ℓ·P = O, ℓ prime) before
   it is sent.
5. **Fixture facts are proven, not trusted** (see Tests): no displayed group order comes from a
   constant alone.
6. **x-only means ±.** The x-only service identifies α with −α. The page says the attack recovers
   "±α — the same key for every x-only operation" and verifies by x(c·G) = public key.
7. **Real curves are never attacked.** Act 5 computes orders and runs KATs; it sends nothing to a
   real-curve "service" except the clamped order-4 demonstration.

### ARCHITECTURE

```
src/field/fp.ts           F_p arithmetic, Euler's criterion, sqrt for p ≡ 3 (mod 4)
src/curve/montgomery.ts   x-only ladder (RFC 7748 §5 shape, generic p, A, a24)
src/curve/weierstrass.ts  affine short-Weierstrass group law (b unused — the point of the lab)
src/curve/maps.ts         Montgomery ↔ Weierstrass; twist x ↦ E^(−1)
src/curve/fixtures.ts     the toy curve, twist factors, invalid curves, real-curve p and n,
                          each with provenance comments
src/service/xonly.ts      Bob's x-only static-DH service (validate toggle)
src/service/full.ts       Bob's full-coordinate service (validate toggle)
src/attack/twist.ts       twist attack (isolated)
src/attack/invalid.ts     invalid-curve attack (isolated)
src/attack/cofactor.ts    order-4 leak
src/dlog/bsgs.ts, src/nt/crt.ts   (own code, or copied from Log Forge with attribution)
src/real/orders.ts        twist orders + trial division (worker)
src/verify/verify.ts      independent check; imports neither src/curve nor src/attack
src/worker/*              off-thread trial division and BSGS; BigInt as decimal strings
src/ui/*                  one module per act
```

Native BigInt only. Hand-roll all curve arithmetic — it is the subject.

### UI

- **Act 2 is the core interaction.** A "Validate input" switch with its state in words. A table:
  query #, the point's order ℓ, the u sent, Bob's answer, the solved residue "α ≡ ±k (mod ℓ)".
  One button per query, or "run all five". A CRT panel then lists the candidates and marks the one
  that matches the public key. A counter: "5 questions" beside "≈ 2^29.5 steps for the honest
  route (formula)".
- Act 3: the same table shape, one row per invalid curve b′.
- Act 4: an order-4 point, the validation result (passes), the leak, then the clamp toggle.
- Act 5: a table per curve (p, n, twist order, small factors found, remaining cofactor bits,
  SafeCurves' rho cost) and the X25519 KAT results.
- Stacks below 640px; long runs cancellable; changed inputs retire old verdicts.

### VISUAL SEMANTICS

- A recovered key is **ALARM** for Bob, whatever button produced it.
- With validation ON, a refused point reads as Bob holding ("REFUSED: not on E").
- Act 4's fixture reads "ON THE CURVE — AND LEAKING".
- Always icon + text + colour; check grayscale and deuteranopia.

### EDGE CASES

| Input | Behaviour |
|---|---|
| u ≥ p or non-canonical encoding | refused by both services, with the reason |
| u with u³ + A·u² + u = 0 (order-2 points) | handled; shown as a cofactor point |
| Ladder result is the point at infinity | reported as "O" (all-zero), never as x = 0 silently |
| Twist point whose multiple is O before reaching order ℓ | resampled; counted |
| Full-coordinate input not on any fixture curve | the attacker module refuses to send it |
| CRT candidates with no public-key match | reported as an attack failure, never a guessed key |
| Validation toggled mid-attack | attack cancelled; old verdict retired |

### EXTENSION SEAMS

- `// [extension] point` in `src/curve/weierstrass.ts`: an x-only Weierstrass ladder (B–S Ex. 15.2
  formulas 15.37/15.38, which use b — and so also compute on the twist).
- `// [extension] point` in `src/service/full.ts`: the Bluetooth fixed-coordinate (y = 0)
  variant as an executed attack against a toy pairing transcript.
- `// [extension] point` in `src/real/orders.ts`: brainpoolP256r1 and Curve448/X448 twists.

## Tests

**Fixture proofs (Vitest), no point counting needed:**
- p, q and every listed factor are prime (Miller–Rabin with fixed bases, plus trial division
  below 2^20 as a second route).
- #E: a point G ≠ O with q·G = O, and q > 4√p, so the Hasse interval [p+1−2√p, p+1+2√p] holds
  exactly one multiple of q; assert that multiple is 4q.
- #Ẽ = 2p + 2 − #E; the lcm of the orders of eight random twist points equals #Ẽ, and #Ẽ > 4√p,
  which pins it the same way.
- Each invalid curve: a point of exact order ℓ is exhibited; its stated order factorization
  multiplies back.
- The Montgomery ↔ Weierstrass map and the twist map take points to points (equation checks both
  ways).
- Real curves: recompute each twist order from SEC 2 / RFC 7748 constants; assert 34905 divides
  P-256's, 3²·13²·3319·22639 divides secp256k1's, and Curve25519's equals 4·ℓ′; MR on the remaining
  cofactors.

**KATs:** RFC 7748 §5.2 — both X25519 scalar-multiplication vectors, and the iterated results after
1 and 1,000 iterations — run through the lab's own ladder (not a library). Each is a full
255-step ladder, so no "short input" shortcut applies.

**Attack tests:** for random α, the twist attack and the invalid-curve attack recover ±α / α using
only service outputs (the import test from invariant 2); with validation ON, both fail at the
first query.

**`e2e/claims.spec.ts` (§4.1b):**
- recompute every displayed answer x(α·P) or α·V in the test with an independent ladder / group
  law written in the test file, from the displayed inputs and the displayed recovered key;
- parse the residue table, CRT it in the test, and compare to the page's candidate list;
- verify the chosen candidate against the displayed public key;
- Act 5: recompute each displayed twist order from the displayed p and n, and multiply the shown
  factors back;
- retirement on toggle change, and the no-op guard.

**§4.1c mutations, one per rendered verdict (scripted):**
- validation check inverted;
- CRT uses a wrong modulus;
- the sign loop skips the negative branch for one residue;
- BSGS returns k + 1;
- the public-key match compares y instead of x;
- Act 5's divisor list drops 179;
- the cofactor clamp clears one bit too few.

**§4.1d negative claims, scoped to this lab:**
- **Fixture A.** "The RFC 7748 all-zero output check does not stop the twist attack on this toy
  curve." Setup: x-only service, input validation OFF, all-zero check ON. Every rendered check is
  green (output non-zero, ladder completed, protocol completed) and α is recovered. Verdict:
  "ALL-ZERO CHECK PASSED — AND KEY RECOVERED". (The check only catches points whose order divides
  the cofactor.)
- **Fixture B.** "An on-curve check does not stop a small-subgroup point that is on the curve."
  Act 4 with validation ON and no clamp: "ON THE CURVE — AND LEAKING α mod 4".

## Honesty notes for the page

- Toy-scale only. The toy curve was chosen to have a weak twist; real curves are only measured.
- Real attacks need a service that answers α·P for attacker-chosen P (static DH, an OPRF, ECIES
  decryption with an oracle). Ephemeral-key protocols leak far less per handshake.
- The SafeCurves numbers are SafeCurves' estimates; the B–S "times easier" figures are the book's.
- Not production crypto — a teaching demo.

## Links out

PSI Gate (ristretto255 rejecting malformed points) · Curve448 (clamping) · Curve Lens (the real
curves) · Key Exchange (the warning this lab executes) · Log Forge (Pohlig–Hellman and the Z*_p
membership check) · Point Arithmetic (the group law).

## Sources (verified 2026-10-20)

- D. Boneh, V. Shoup, *A Graduate Course in Applied Cryptography*, v0.6, Jan. 2023,
  https://toc.cryptobook.us/ — §15.3.2, Ex. 15.1, 15.2, 15.4, Remark 12.1, §16.1.2 (read in the
  book text; the P-256 and secp256k1 twist factors were checked by computation, above).
- A. Langley, M. Hamburg, S. Turner, RFC 7748, January 2016 — https://www.rfc-editor.org/rfc/rfc7748
  (§4.1 order and cofactor 8; §5 ladder, a24 = 121665; §5.2 vectors; §6.1 "MAY check … all-zero").
- Certicom Research, *SEC 2: Recommended Elliptic Curve Domain Parameters*, v2.0, 27 Jan. 2010 —
  https://www.secg.org/sec2-v2.pdf (secp256r1 and secp256k1 n checked).
- D. J. Bernstein, T. Lange, SafeCurves, "Twist security" — https://safecurves.cr.yp.to/twist.html
  (twist rho costs; Curve25519 ℓ′ and cofactor 2²).
- I. Biehl, B. Meyer, V. Müller, "Differential Fault Attacks on Elliptic Curve Cryptosystems,"
  CRYPTO 2000, LNCS 1880, pp. 131–146, doi:10.1007/3-540-44598-6_8.
- T. Jager, J. Schwenk, J. Somorovsky, "Practical Invalid Curve Attacks on TLS-ECDH," ESORICS 2015,
  Part I, pp. 407–425, doi:10.1007/978-3-319-24174-6_21.
- E. Biham, L. Neumann, "Breaking the Bluetooth Pairing – The Fixed Coordinate Invalid Curve
  Attack," SAC 2019; IACR ePrint 2019/1043 — https://eprint.iacr.org/2019/1043 (y = 0 trick; 50% /
  25% success rates).
- CERT/CC VU#304725, CVE-2018-5383, 23 July 2018 — https://www.kb.cert.org/vuls/id/304725
