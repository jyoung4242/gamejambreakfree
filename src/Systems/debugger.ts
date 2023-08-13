import { Vector } from "../../_SqueletoECS/Vector";
import { Entity } from "../../_SqueletoECS/entity";
import { System } from "../../_SqueletoECS/system";
import { DebugComponent } from "../Components/debug";
import { Box, System as dcSystem } from "detect-collisions";

export type DebugEntity = Entity & DebugComponent;

export class DebugSystem extends System {
  dc;
  firsttimeflag: boolean = true;
  public template = ``;
  public constructor(collider: dcSystem, public debugentities: any) {
    super("debugging");
    this.dc = collider;
  }

  public processEntity(entity: DebugEntity): boolean {
    //console.log(entity);

    return entity.debug != null;
  }

  // update routine that is called by the gameloop engine
  public update(deltaTime: number, now: number, entities: DebugEntity[]): void {
    entities.forEach(entity => {
      // This is the screening for skipping entities that aren't impacted by this system
      // if you want to impact ALL entities, you can remove this
      if (!this.processEntity(entity)) {
        return;
      }

      if (entity.debug.myCanvas == undefined) return;
      if (entity.debug.myCtx == null) return;
      if (this.firsttimeflag) {
        console.log("loading debug entities");
        this.firsttimeflag = false;

        this.debugentities.forEach((ent: any) => {
          this.dc.insert(new Box({ x: ent[0] * 16, y: ent[1] * 16 }, 16, 16, { isStatic: true }));
        });
        console.log(this.debugentities);
      }
      entity.debug.myCtx.clearRect(0, 0, entity.debug.myCanvas.width, entity.debug.myCanvas.height);
      entity.debug.myCtx.strokeStyle = "#FFFFFF";
      entity.debug.myCtx.beginPath();
      this.dc.draw(entity.debug.myCtx);
      entity.debug.myCtx.stroke();
    });
  }
}
