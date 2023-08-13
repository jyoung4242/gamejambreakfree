//@ts-ignore
import { v4 as uuidv4 } from "uuid";
import { Entity } from "../../_SqueletoECS/entity";

export class debugEntity {
  static create(width: number, height: number) {
    return Entity.create({
      id: uuidv4(),
      components: {
        type: { data: "debugger" },
        position: [0, 0],
        debug: { data: true, w: width, h: height },
        size: { data: [width, height] },
        orientation: 0,
        zindex: 4,
      },
    });
  }
}
