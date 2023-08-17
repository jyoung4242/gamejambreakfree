//@ts-ignore
import { v4 as uuidv4 } from "uuid";
import { Entity } from "../../_SqueletoECS/entity";
import cage from "../Assets/cage.png";
import { Vector } from "../../_SqueletoECS/Vector";

export class cageEntity {
  static create(configObject: { id: string; position: Vector; velocity: Vector; angle: number }) {
    return Entity.create({
      id: uuidv4(),
      components: {
        type: { data: "cage" },
        sid: configObject.id,
        size: { data: [16, 16] },
        position: configObject.position,
        zindex: 2,
        velocity: configObject.velocity,
        orientation: configObject.angle,
        angVelocity: { data: 0 },
        border: {
          data: {
            radius: 0,
            color: "transparent",
          },
        },
        overflow: false,
        sprites: [
          {
            src: cage,
            size: [16, 16],
            angle: 0,
            offset: [0, 0], //centers on entity
            anchor: new Vector(8, 8),
            fit: "cover",
          },
        ],
      },
    });
  }
}
