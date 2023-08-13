import { Entity } from "../../_SqueletoECS/entity";
import { System } from "../../_SqueletoECS/system";
import { AngVelocityComponent } from "../Components/angVelocity";
import { SpritesComponent } from "../Components/sprites";

// type definition for ensuring the entity template has the correct components
// ComponentTypes are defined IN the components imported
export type RotateEntity = Entity & AngVelocityComponent & SpritesComponent;

export class RotateSystem extends System {
  public template = ``;
  public constructor() {
    super("rotate");
  }

  public processEntity(entity: RotateEntity): boolean {
    return entity.angVelocity != null && entity.sprites != null;
  }

  // update routine that is called by the gameloop engine
  public update(deltaTime: number, now: number, entities: RotateEntity[]): void {
    entities.forEach(entity => {
      if (!this.processEntity(entity)) {
        return;
      }
      entity.sprites[0].angle += entity.angVelocity;
    });
  }
}
