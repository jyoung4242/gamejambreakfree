//@ts-ignore
import { v4 as uuidv4 } from "uuid";
import { Entity } from "../../_SqueletoECS/entity";

export class playerEntity {
  static create(
    playername: string,
    startingPoint: number[],
    color: string,
    playerControlled: boolean,
    border: { radius: number; color: string }
  ) {
    return Entity.create({
      id: uuidv4(),
      components: {
        type: { data: "player" },
        name: playername,
        size: { data: [16, 16] },
        position: startingPoint,
        velocity: [0, 0],
        color: { data: color },
        zindex: 2,
        border: {
          data: {
            radius: border.radius,
            color: border.color,
          },
        },
        overflow: true,
        orientation: 0,
        keyboard: { data: playerControlled },
      },
    });
  }
}
