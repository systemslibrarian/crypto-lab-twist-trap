import {Q,B_SHORT} from '../curve/fixtures';
import {onCurve,multiply,type Point} from '../curve/weierstrass';
import {mainGenerator} from '../curve/maps';
import {canonical} from '../curve/montgomery';
export class FullService {
 #alpha:bigint;
 constructor(alpha:bigint,public validate=true){if(alpha<=0n||alpha>=Q)throw new RangeError('Bad private scalar');this.#alpha=alpha}
 get publicKey():Point{return multiply(this.#alpha,mainGenerator())}
 query(pt:Point):Point{
  if(!pt||!canonical(pt.x)||!canonical(pt.y))throw new RangeError('Refused: non-canonical point');
  if(this.validate&&!onCurve(pt,B_SHORT))throw new RangeError('REFUSED: point not on E');
  return multiply(this.#alpha,pt);
 }
 // [extension] point: Bluetooth's fixed-coordinate y=0 variant would add an explicit pairing model.
}
