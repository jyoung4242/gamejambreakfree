//@ts-ignore
import { v4 as uuidv4 } from "uuid";
import { Entity } from "../../_SqueletoECS/entity";
import { Vector } from "../../_SqueletoECS/Vector";
import rock from "../Assets/rock.png";
import whip from "../Assets/whip.png";
import knife from "../Assets/jamknife.png";
import club from "../Assets/club.png";
//import machete from '../Assets/machete.png';
//import spear from '../Assets/spear.png

export type weaponType = "knife" | "whip" | "machete" | "spear" | "rock" | "club";
export type direction = "left" | "right" | "down" | "up";

const clubAnimation = {
  frameRate: 4,
  default: "onground",
  sequences: {
    onground: [[0, 0]],
    engaged: [
      [32, 0],
      [48, 0],
      [64, 0],
      [80, 0],
    ],
  },
};
const whipAnimation = {
  frameRate: 6,
  default: "onground",
  sequences: {
    onground: [[0, 0]],
    engaged: [
      [16, 0],
      [32, 0],
      [48, 0],
      [64, 0],
      [80, 0],
      [98, 0],
      [98, 0],
      [98, 0],
      [98, 0],
    ],
  },
};
const rockAnimation = {
  frameRate: 10,
  default: "onground",
  sequences: {
    onground: [[0, 0]],
    engaged: [[0, 0]],
  },
};
const knifeAnimation = {
  frameRate: 4,
  default: "onground",
  sequences: {
    onground: [[0, 0]],
    engaged: [
      [0, 0],
      [16, 0],
      [32, 0],
      [48, 0],
    ],
  },
};

export class weaponEntity {
  static create(
    id: string,
    weaponType: weaponType,
    playerposition: Vector,
    playervelocity: Vector,
    playerdirection: direction,
    status: string
  ) {
    let myImage;
    let myAnimation = clubAnimation;
    let myPosition: Vector;
    let myAngle: number;
    let myVelocity: Vector = new Vector(0, 0);

    console.log(playerposition);
    let pposition: Vector = new Vector(playerposition.x, playerposition.y);
    switch (playerdirection) {
      case "left":
        myPosition = pposition.add(new Vector(-24, -8));
        myAngle = 180;
        break;
      case "right":
        myPosition = pposition.add(new Vector(8, -8));
        myAngle = 0;
        break;
      case "down":
        myPosition = pposition.add(new Vector(-8, 8));
        myAngle = 90;
        break;
      case "up":
        myPosition = pposition.add(new Vector(-8, -24));
        myAngle = -90;
        break;
      default:
        playerdirection = "right";
        myPosition = pposition.add(new Vector(8, -8));
        myAngle = 0;
        break;
    }

    switch (weaponType) {
      case "knife":
        myImage = knife;
        myAnimation = knifeAnimation;

        break;
      case "whip":
        myImage = whip;
        myAnimation = whipAnimation;
        break;
      case "machete":
        myImage = club;
        myAnimation = clubAnimation;
        break;
      case "spear":
        myImage = club;
        myAnimation = clubAnimation;
        break;
      case "rock":
        myImage = rock;
        myAnimation = rockAnimation;
        break;
      case "club":
        myImage = club;
        myAnimation = clubAnimation;

        break;
      default:
        myAnimation = clubAnimation;
        break;
    }

    myAnimation.default = status;

    console.log("weapon creation: ", myImage, weaponType);

    return Entity.create({
      id: uuidv4(),
      components: {
        type: { data: `${weaponType}` },
        position: myPosition,
        sid: id,
        size: { data: [16, 16] },
        sprites: [
          {
            src: myImage,
            size: [16, 16],
            angle: myAngle,
            offset: [0, 0], //centers on entity
            animation: myAnimation,
            anchor: new Vector(8, 8),
            fit: "cover",
          },
        ],
        orientation: 0,
        zindex: 2,
      },
    });
  }
}
