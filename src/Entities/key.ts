//@ts-ignore
import { v4 as uuidv4 } from "uuid";
import { Entity } from "../../_SqueletoECS/entity";
import key from "../Assets/key.png";
import { Vector } from "../../_SqueletoECS/Vector";

export class keyEntity {
  static create(position: Vector) {
    return Entity.create({
      id: uuidv4(),
      components: {
        type: { data: "key" },
        size: { data: [16, 16] },
        position: position,
        zindex: 2,
        orientation: 0,
        overflow: false,
        border: {
          data: {
            radius: 0,
            color: "transparent",
          },
        },
        sprites: [
          {
            src: key,
            size: [16, 16],
            angle: 0,
            offset: [0, 0], //centers on entity
            anchor: new Vector(0, 0),
            fit: "cover",
          },
        ],
      },
    });
  }
}
