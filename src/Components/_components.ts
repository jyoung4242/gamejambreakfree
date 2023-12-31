// initialize all your system components here
// simply import then and create a new instance in the array
// for example
// import { Name } from "./nameComp";
// export function LoadComponents(){
//  [new Name(),... and all your other components follow]
// }

import { angVelocity } from "./angVelocity";
import { ColliderComp } from "./collider";
import { damageComp } from "./damage";
import { DebugComp } from "./debug";
import { enemyAIComp } from "./enemyAI";
import { enemyGenComp } from "./genEnemy";
import { InventoryComp } from "./inventory";
import { KeyboardComp } from "./keyboard";
import { Name } from "./nameComp";
import { OrientationComp } from "./orientation";
import { ColorComp } from "./playerColor";
import { Position } from "./positionComp";
import { sID } from "./serverid";
import { SizeComp } from "./sizeComp";
import { SpritesComp } from "./sprites";
import { TypeComp } from "./typeComponent";
import { Velocity } from "./velocityComp";
import { ZindexComp } from "./zindexComp";
import { healthComp } from "./health";
import { borderComp } from "./border";
import { overflowComp } from "./overflow";

// The template component is demonstrated by default, you'll probably
// want to replace it

export function LoadComponents() {
  [
    new SpritesComp(),
    new TypeComp(),
    new Position(),
    new ZindexComp(),
    new SizeComp(),
    new Velocity(),
    new OrientationComp(),
    new Name(),
    new ColorComp(),
    new KeyboardComp(),
    new ColliderComp(),
    new enemyGenComp(),
    new enemyAIComp(),
    new angVelocity(),
    new sID(),
    new DebugComp(),
    new InventoryComp(),
    new damageComp(),
    new overflowComp(),
    new borderComp(),
    new healthComp(),
  ];
}
