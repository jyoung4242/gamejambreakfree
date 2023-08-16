import { Vector } from "../../_SqueletoECS/Vector";
import { Entity } from "../../_SqueletoECS/entity";
import { System } from "../../_SqueletoECS/system";
import { enemyGenComponent } from "../Components/genEnemy";
import { System as dcSystem } from "detect-collisions";
import { PositionComponent } from "../Components/positionComp";
//import { enemyEntity } from "../Entities/enemy";

// type definition for ensuring the entity template has the correct components
// ComponentTypes are defined IN the components imported
export type generateEnemyEntity = Entity & enemyGenComponent & PositionComponent;

export class generateEnemySystem extends System {
  public template = ``;
  genTik: number = 0;
  genTikTriggerLimit = 100;
  public constructor() {
    super("generateEnemies");
  }

  public processEntity(entity: generateEnemyEntity): boolean {
    // return the test to determine if the entity has the correct properties

    return entity.enemyGen != null && entity.position != null;
    // entities that have position and velocity properties can use this system
    return true;
  }

  // update routine that is called by the gameloop engine
  public update(deltaTime: number, now: number, entities: generateEnemyEntity[]): void {
    this.genTik++;
    if (this.genTik >= this.genTikTriggerLimit) {
      this.genTik = 0;
      entities.forEach(entity => {
        // This is the screening for skipping entities that aren't impacted by this system
        // if you want to impact ALL entities, you can remove this
        if (!this.processEntity(entity)) {
          return;
        }

        //find open spot on map near generator
        //randomly check around generator for open spot
        const randomVectors = generateRandomVectors(entity.position);

        for (let index = 0; index < randomVectors.length; index++) {
          const thisVector = randomVectors[index];

          const startingVector = entity.position.add(thisVector);
          const endingVector = startingVector.add(thisVector);

          const hit = this.collider.raycast(startingVector, endingVector);

          if (hit) {
            //console.log("found entity: ", hit);

            continue;
          } else {
            console.log(
              "entity vector",
              entity.position,
              "raycast vector: ",
              thisVector,
              "starting vector: ",
              startingVector,
              "random Vectors: ",
              endingVector
            );

            //if open spot, create enemy entity
            //@ts-ignore
            entities.push(enemyEntity.create(startingVector, this.collider));
            console.log(entities);

            break;
          }
        }
      });
    }
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateRandomVectors(startingVector: Vector): Array<Vector> {
  const tileVectors: Vector[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) {
        continue; // Skip the center tile (entity's position)
      }
      const raycastVector = new Vector(dx, dy).multiply(10);

      //const tileVector = startingVector.add(raycastVector);
      //console.log("tile", tileVector);

      tileVectors.push(raycastVector);
    }
  }
  return shuffleArray(tileVectors);
}
