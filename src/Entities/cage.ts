//@ts-ignore
import { v4 as uuidv4 } from "uuid";
import { Entity } from "../../_SqueletoECS/entity";
import cage from "../Assets/cage.png";
import { Vector } from "../../_SqueletoECS/Vector";

export class cageEntity {
  static create(startingPoint: Vector) {
    return Entity.create({
      id: uuidv4(),
      components: {
        size: { data: [16, 16] },
        position: startingPoint,
        zindex: 2,
        orientation: 0,
        sprites: [
          {
            src: cage,
            size: [16, 16],
            angle: 0,
            offset: [-8, -8], //centers on entity
            anchor: new Vector(0, 0),
            fit: "cover",
          },
        ],
      },
    });
  }
}
