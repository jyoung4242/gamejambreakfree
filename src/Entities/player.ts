//@ts-ignore
import { v4 as uuidv4 } from "uuid";
import { Entity } from "../../_SqueletoECS/entity";

export class playerEntity {
  static create(playername: string, startingPoint: number[], color: string, playerControlled: boolean) {
    return Entity.create({
      id: uuidv4(),
      components: {
        name: playername,
        size: { data: [16, 16] },
        position: startingPoint,
        velocity: [0, 0],
        color: { data: color },
        zindex: 2,
        orientation: 0,
        keyboard: { data: playerControlled },
      },
    });
  }
}
