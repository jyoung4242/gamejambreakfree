//@ts-ignore
import { v4 as uuidv4 } from "uuid";
import { Entity } from "../../_SqueletoECS/entity";
import baddie from "../Assets/Skeleton.png";
import { Vector } from "../../_SqueletoECS/Vector";
import { direction } from "./weapon";
//@ts-ignore
import Chance from "chance";

const chance = new Chance();

const enemyAnimation = {
  frameRate: 8,
  default: "idle-down",
  sequences: {
    "idle-down": [
      [0, 0],
      [32, 0],
      [64, 0],
      [96, 0],
    ],
    "idle-right": [
      [0, 32],
      [32, 32],
      [64, 32],
      [96, 32],
    ],
    "idle-left": [
      [0, 32, -1],
      [32, 32, -1],
      [64, 32, -1],
      [96, 32, -1],
    ],
    "idle-up": [
      [0, 64],
      [32, 64],
      [64, 64],
      [96, 64],
    ],
    "walk-down": [
      [0, 96],
      [32, 96],
      [64, 96],
      [96, 96],
    ],
    "walk-right": [
      [0, 112],
      [32, 112],
      [64, 112],
      [96, 112],
    ],
    "walk-left": [
      [0, 112, -1],
      [32, 112, -1],
      [64, 112, -1],
      [96, 112, -1],
    ],
    "walk-up": [
      [0, 160],
      [32, 160],
      [16, 160],
      [96, 160],
    ],
    "damage-down": [
      [0, 192],
      [32, 192],
      [0, 192],
      [32, 192],
      [0, 192],
      [32, 192],
    ],
    "damage-right": [
      [0, 224],
      [32, 224],
      [0, 224],
      [32, 224],
      [0, 224],
      [32, 224],
    ],
    "damage-left": [
      [0, 224, -1],
      [32, 224, -1],
      [0, 224, -1],
      [32, 224, -1],
      [0, 224, -1],
      [32, 224, -1],
    ],
    "damage-up": [
      [0, 256],
      [32, 256],
      [0, 256],
      [32, 256],
      [0, 256],
      [32, 256],
    ],
    "death-down": [
      [0, 288],
      [32, 288],
      [0, 288],
      [32, 288],
      [0, 288],
      [32, 288],
    ],
    "death-right": [
      [0, 320],
      [32, 320],
      [0, 320],
      [32, 320],
      [0, 320],
      [32, 320],
    ],
    "death-left": [
      [0, 320, -1],
      [32, 320, -1],
      [0, 320, -1],
      [32, 320, -1],
      [0, 320, -1],
      [32, 320, -1],
    ],
    "death-up": [
      [0, 352],
      [32, 352],
      [0, 352],
      [32, 352],
      [0, 352],
      [32, 352],
    ],
  },
};

export class enemyEntity {
  static create(startingPosition: Vector, sid: string, state: string, direction: direction) {
    return Entity.create({
      id: uuidv4(),
      components: {
        position: startingPosition,
        sid: sid,

        type: { data: "enemy" },
        zindex: 3,
        // health: { data: 25 },
        orientation: 0,
        velocity: new Vector(0, 0),
        size: { data: new Vector(16, 16) },
        border: {
          data: {
            radius: 0,
            color: "transparent",
          },
        },
        overflow: false,
        sprites: [
          {
            src: baddie,
            size: [32, 32],
            angle: 0,
            offset: [0, 0],
            animation: enemyAnimation,
            anchor: new Vector(0, 0),
            fit: "auto",
            flip: "1",
          },
        ],
      },
    });
  }
}
