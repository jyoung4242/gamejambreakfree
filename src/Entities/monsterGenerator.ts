//@ts-ignore
import { v4 as uuidv4 } from "uuid";
import { Entity } from "../../_SqueletoECS/entity";
import bonesl from "../Assets/boneslarge.png";
import { Vector } from "../../_SqueletoECS/Vector";
import { System as dcSystem } from "detect-collisions";

export class GeneratorEntity {
  static create(startingPosition: Vector, sid: string) {
    return Entity.create({
      id: uuidv4(),
      components: {
        type: { data: "generator" },
        sid: sid,
        enemyGen: { data: true },
        orientation: 0,
        position: startingPosition,
        border: {
          data: {
            radius: 0,
            color: "transparent",
          },
        },
        overflow: false,
        zindex: 2,
        size: { data: [16, 16] },
        sprites: [
          {
            src: bonesl,
            size: [16, 16],
            angle: 0,
            offset: [0, 0], //centers on entity
            anchor: new Vector(0, 0),
            fit: "cover",
            flip: "1",
          },
        ],
      },
    });
  }
}
