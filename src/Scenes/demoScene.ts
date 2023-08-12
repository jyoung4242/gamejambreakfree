// Library
import { Scene } from "../../_SqueletoECS/Scene";
import { Vector } from "../../_SqueletoECS/Vector";
import { Engine } from "@peasy-lib/peasy-engine";
import { AuthenticationType, MultiPlayerInterface } from "../../_SqueletoECS/Multiplayer";

import map from "../Assets/intialtiles.png";
let mapImage;
let mapsize: Vector = new Vector(0, 0);

// Scene Systems
/* *README*
  You will import all your  ECS Systems here for this scene here
  for example
  import { MovementSystem } from "../Systems/Movement";
  The camera is required, so we already included it for you
  ... you're welcome ;)
*/
import { Camera, ICameraConfig } from "../../_SqueletoECS/Camera"; //this is in Squeleto library
import { MapEntity } from "../Entities/map";
import { LevelMaker } from "../levelmaker";
import { playerEntity } from "../Entities/player";
import { cageEntity } from "../Entities/cage";
import { KeypressSystem } from "../Systems/keypress";

// Entities

/* *README*
  You will import all your  ECS entities for this scene here
  for example
  import { MapEntity } from "../Entities/mapEntity"
  import { DemoEntity } from "../Entities/demo";
*/
export class Test extends Scene {
  state: any = [];
  firstUpdate: boolean = true;
  name: string = "test";
  userId: string = "";
  camera: Camera | undefined = undefined;
  mapMatrix: Array<Array<number>> = [];
  HathoraClient: MultiPlayerInterface | undefined;
  roomID: string | undefined = "";
  entities: any = [];
  entitySystems: any = [];
  sceneSystems: any = [];
  public template = `
    <scene-layer>
        < \${ sceneSystem === } \${ sceneSystem <=* sceneSystems }
    </scene-layer>
  `;

  handleMap = async (mapdata: any) => {
    this.mapMatrix = mapdata;
    let lm = new LevelMaker(64, 64, 16);
    lm.readMap(this.mapMatrix);
    await lm.loadTileset(map);
    await lm.loadTileDefinition(setMapping());
    await lm.loadBitmasks(setBitmappings());
    lm.setZeroTiles(["floor"]);
    lm.fillMap("floor");
    lm.setBaseTiles();
    mapImage = await lm.getMapImage();
    mapsize = new Vector(lm.getMapImageSize().x, lm.getMapImageSize().y);
    if (this.camera) {
      this.entities.push(await MapEntity.create(mapImage, mapsize.x, mapsize.y));
    }
  };

  public init = async (): Promise<void> => {
    this.HathoraClient = this.params[0];
    //(this.HathoraClient as MultiPlayerInterface).updateCallback = this.messageHandler;
    this.HathoraClient?.setUpdateCallback(this.messageHandler);
    this.userId = this.HathoraClient?.userdata.id as string;
    console.log(this.HathoraClient);

    //establish Scene Systems - Configuring Camera
    let cConfig: ICameraConfig = {
      name: "camera",
      viewPortSystems: [],
      gameEntities: this.entities,
      position: new Vector(0, 0),
      size: new Vector(400, 266.67),
    };
    let camera = Camera.create(cConfig);
    this.camera = camera;
    (this.HathoraClient as MultiPlayerInterface).sendMessage("sendMap", "");
    //give the camera its systems to own
    camera.vpSystems.push(new KeypressSystem(this.HathoraClient as MultiPlayerInterface));

    //Systems being added for Scene to own
    this.sceneSystems.push(this.camera);

    //Start GameLoop
    Engine.create({ fps: 60, started: true, callback: this.update });
  };

  //GameLoop update method
  update = (deltaTime: number): void | Promise<void> => {
    this.sceneSystems.forEach((system: any) => {
      system.update(deltaTime / 1000, 0, this.entities, this.state);
    });
  };

  messageHandler = async (message: any) => {
    console.log(message);

    switch (message.type) {
      case "map":
        this.handleMap(JSON.parse(message.msg));
        return;
      case "USERLIST":
        let { users, type, roomID } = message;
        users.forEach((user: any) => {
          console.log(user);

          let userIndex = this.camera?.entities.findIndex((ent: any) => {
            return ent.name == user.id;
          });
          if (userIndex == -1) {
            console.log("found player");

            //user not in the entities list
            let playercontrolled;
            if (user.id == this.userId) playercontrolled = true;
            else playercontrolled = false;
            console.log("playercontrolled: ", playercontrolled);

            const newEntity = playerEntity.create(user.id, [user.position.x, user.position.y], user.color, playercontrolled);
            if (playercontrolled) this.camera?.follow(newEntity);
            this.camera?.entities.push(newEntity);
          }
        });
        break;
      case "stateupdate":
        this.firstUpdate = updateState(this.firstUpdate, this.entities, this.camera as Camera, message.state, this.userId) as boolean;
        this.state = message.state;
        break;
    }
  };
}

function setMapping() {
  return [
    { name: "floor", tiles: [{ tilelocX: 0, tilelocY: 16 }] },
    { name: "wall", tiles: [{ tilelocX: 0, tilelocY: 0 }] },
  ];
}

function setBitmappings() {
  return [
    [0x0, "wall"],
    [0xd0, "wall"],
    [0xf8, "wall"],
    [0x78, "wall"],
    [0xd8, "wall"],
    [0x68, "wall"],
    [0xd6, "wall"],
    [0x6b, "wall"],
    [0x16, "wall"],
    [0x0b, "wall"],
    [0x50, "wall"],
    [0x18, "wall"],
    [0x48, "wall"],
    [0x42, "wall"],
    [0x12, "wall"],
    [0xa, "wall"],
    [0x40, "wall"],
    [0x10, "wall"],
    [0x2, "wall"],
    [0x8, "wall"],
    [0x52, "wall"],
    [0x4a, "wall"],
    [0x1a, "wall"],
    [0x58, "wall"],
    [0x7b, "wall"],
    [0xde, "wall"],
    [0xfa, "wall"],
    [0x5f, "wall"],
    [0xd4, "wall"],
    [0x7f, "wall"],
    [0x9f, "wall"],
    [0x3f, "wall"],
    [0x1f, "wall"],
    [0xdf, "wall"],
    [0xfb, "wall"],
    [0xfe, "wall"],
    [0x1e, "wall"],
    [0x4b, "wall"],
    [0x56, "wall"],
    [0x6a, "wall"],
    [0xdb, "wall"],
    [0x1b, "wall"],
    [0xd2, "wall"],
    [0x7e, "wall"],
    [0xda, "wall"],
    [0x5a, "wall"],
    [0x5b, "wall"],
    [0x7a, "wall"],
    [0x5e, "wall"],
    [0xff, "wall"],
  ];
}

function updateState(firsttime: boolean, entities: any, camera: Camera, state: any, userid: string) {
  if (firsttime) {
    firsttime = false;
    console.log(state);
    console.log("userid: ", userid);

    state.cages.forEach((cage: Vector) => {
      camera.entities.push(cageEntity.create(cage));
    });

    state.players.forEach((player: any) => {
      addEntity(camera, player, userid);
    });
    return false;
  }
  entities.forEach((entity: any) => {
    //find entity in state
    if (entity.name) {
      console.log(entity);

      const entIndex = state.players.findIndex((player: any) => player.id == entity.name);
      if (entIndex >= 0) {
        entity.position = state.players[entIndex].position;
      }
    }
  });
}

function addEntity(camera: Camera, player: any, id: string) {
  let playercontrolled;
  console.log(player.id, id);

  if (player.id == id) playercontrolled = true;
  else playercontrolled = false;
  console.log("playercontrolled: ", playercontrolled);

  const newEntity = playerEntity.create(player.id, [player.position.x, player.position.y], player.color, playercontrolled);
  if (playercontrolled) camera?.follow(newEntity);
  camera?.entities.push(newEntity);
}
