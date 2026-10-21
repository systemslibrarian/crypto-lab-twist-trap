# Twist Trap

## What It Is

Implements a 61-bit toy Montgomery ladder and affine short-Weierstrass arithmetic. Two static chosen-point services demonstrate five-query quadratic-twist and invalid-curve secret recovery; both input-validation toggles default ON. A separate verifier checks a recovered scalar against Bob’s public key. Not production crypto — a teaching demo. All material is generated in memory; this static site has no account, backend or key storage.

## Exhibits

1. Test a chosen x coordinate for curve or twist membership and run the same x-only ladder.
2. Switch off twist validation, query five exact-order twist points, solve small logs and CRT sign choices, and independently match Bob’s public x.
3. Switch off full-coordinate validation, send five points from alternate b′ curves and recover the full scalar.
4. Send an on-curve order-four point that passes the curve check, then remove the leak by clamping to a multiple of four.
5. Compute twist orders from published real-curve p and n values, and run RFC 7748 X25519 vectors through the lab’s own ladder.

## When to Use It

Use this to study the exact mechanism and its failure boundary. Do not use the toy implementation, keys or protocols in a deployed security system.

## Live Demo

[Open Twist Trap](https://systemslibrarian.github.io/crypto-lab-twist-trap/) to drive the exhibits. The build uses Vite's `/crypto-lab-twist-trap/` base for GitHub Pages.

## What Can Go Wrong

An on-curve check does not remove a small subgroup on the curve; an all-zero output check does not prevent larger-order twist leakage on this toy fixture. Skipping full point validation permits scalar multiplication on other b′ curves regardless of the intended curve’s twist security.

## Real-World Usage

No real curve is attacked. The P-256, secp256k1 and Curve25519 table computes public group orders and divisibility; SafeCurves rho estimates are attributed estimates. Real attacks require a chosen-point service with a reused secret scalar.

## How to Run Locally

```sh
npm ci
npm run dev
```

## Related Demos

[Point Arithmetic](https://github.com/systemslibrarian/crypto-lab-point-arithmetic) · [Log Forge](https://github.com/systemslibrarian/crypto-lab-log-forge) · [Curve Lens](https://github.com/systemslibrarian/crypto-lab-curve-lens) · [Key Exchange](https://github.com/systemslibrarian/crypto-lab-key-exchange)

## Build & Verify

```sh
npm test
npm run build
npx playwright install chromium
npm run test:a11y
npm run test:mutations
```

8 unit tests prove toy group/factor facts, exact-order points, both end-to-end recovery paths, cofactor behavior, both RFC 7748 scalar vectors and the 1,000-iteration vector. The replayable mutation harness contains 4 concrete source patches. Each run first passes its named baseline test, requires a non-empty diff, a successful build and changed JavaScript bundle hash, then requires the owning test to fail and restores the original hash. The Playwright suite scans reachable desktop and mobile states for WCAG 2.1 A/AA issues and independently rederives displayed claims. GitHub Actions runs unit tests, production build and browser gate before deploying; it also gates Dependabot pull requests, groups minor/patch npm updates and dispatches a deploy after an automated merge.

## Performance

All runs are local to the browser. Work figures shown in the page are either actual counted operations or explicitly labelled mathematical estimates/extrapolations. Workers keep long searches cancellable where used. No speed number is a claim about a production deployment.

## Sources

- [Boneh–Shoup v0.6 §15.3.2](https://toc.cryptobook.us/)
- [RFC 7748](https://www.rfc-editor.org/rfc/rfc7748)
- [SEC 2 v2.0](https://www.secg.org/sec2-v2.pdf)
- [SafeCurves twist security](https://safecurves.cr.yp.to/twist.html)

---

*One of the browser demos in the [Crypto Lab](https://crypto-lab.systemslibrarian.dev/) suite.*

*"So whether you eat or drink or whatever you do, do it all for the glory of God." — 1 Corinthians 10:31*
