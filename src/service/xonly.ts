import {Q,GENERATOR_X} from '../curve/fixtures';
import {canonical,onCurve,ladder} from '../curve/montgomery';
export class XService {
 #alpha:bigint;
 constructor(alpha:bigint,public validate=true){if(alpha<=0n||alpha>=Q)throw new RangeError('Bad private scalar');this.#alpha=alpha}
 get publicKey():bigint{return ladder(this.#alpha,GENERATOR_X)!}
 query(u:bigint):bigint|null{
  if(!canonical(u))throw new RangeError('Refused: non-canonical u');
  if(this.validate&&!onCurve(u))throw new RangeError('REFUSED: not on E');
  return ladder(this.#alpha,u);
 }
}

