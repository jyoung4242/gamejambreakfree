//@ts-ignore
import { v4 as uuidv4 } from "uuid";
import { Entity } from "../../_SqueletoECS/entity";
import door from "../Assets/door.png";
import { Vector } from "../../_SqueletoECS/Vector";

const exitSprites = {
  frameRate: 10,
  default: "locked",
  sequences: {
    locked: [[0, 0]],
    unlocked: [[0, 16]],
  },
};

export class exitEntity {
  static create(position: Vector) {
    return Entity.create({
      id: uuidv4(),
      components: {
        type: { data: "exit" },
        size: { data: [16, 16] },
        position: position,
        zindex: 2,
        orientation: 0,
        sprites: [
          {
            src: door,
            size: [16, 16],
            angle: 0,
            offset: [-8, -8], //centers on entity
            animation: exitSprites,
            anchor: new Vector(0, 0),
            fit: "cover",
          },
        ],
      },
    });
  }
}
