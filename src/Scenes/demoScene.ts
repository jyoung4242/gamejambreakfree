// Library
import { Scene } from "../../_SqueletoECS/Scene";
import { Vector } from "../../_SqueletoECS/Vector";
import { Engine } from "@peasy-lib/peasy-engine";
import { AuthenticationType, MultiPlayerInterface } from "../../_SqueletoECS/Multiplayer";
import { System as dcSystem } from "detect-collisions";

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
import { hudUI } from "../Systems/HUD";
import { exitEntity } from "../Entities/exit";
import { RotateSystem } from "../Systems/rotate";
import { DebugSystem } from "../Systems/debugger";
import { debugEntity } from "../Entities/debugDC";
import { keyEntity } from "../Entities/key";
import { animateSpriteSystem } from "../Systems/animateSprite";
import { weaponType } from "../Server/server";
import { weaponEntity } from "../Entities/weapon";
import { generateEnemySystem } from "../Systems/generateEnemies";
import { GeneratorEntity } from "../Entities/monsterGenerator";
import { enemyEntity } from "../Entities/enemy";
// Entities

/* *README*
  You will import all your  ECS entities for this scene here
  for example
  import { MapEntity } from "../Entities/mapEntity"
  import { DemoEntity } from "../Entities/demo";
*/
export class Test extends Scene {
  debugdata: any;
  hud: any;
  state: any;
  startGame = () => {
    this.HathoraClient?.sendMessage("statechange", "startgame");
  };
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
      this.entities.push(debugEntity.create(mapsize.x, mapsize.y));
    }
  };

  public init = async (): Promise<void> => {
    const dc = new dcSystem();
    console.log(this.params);

    this.HathoraClient = this.params[0];
    this.debugdata = this.params[1];
    console.log("in demo, param passed from lobby", this.debugdata);

    //(this.HathoraClient as MultiPlayerInterface).updateCallback = this.messageHandler;
    this.HathoraClient?.setUpdateCallback(this.messageHandler);
    this.userId = this.HathoraClient?.userdata.id as string;
    console.log(this.HathoraClient);

    this.hud = hudUI.create(this.state, this.startGame);
    //establish Scene Systems - Configuring Camera
    let cConfig: ICameraConfig = {
      name: "camera",
      viewPortSystems: [
        this.hud,
        new RotateSystem(),
        new DebugSystem(dc, this.debugdata),
        new animateSpriteSystem(this.HathoraClient as MultiPlayerInterface),
      ],
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
    switch (message.type) {
      case "map":
        this.handleMap(JSON.parse(message.msg));
        return;
      case "USERLIST":
        let { users, type, roomID } = message;
        users.forEach((user: any) => {
          let userIndex = this.camera?.entities.findIndex((ent: any) => {
            return ent.name == user.id;
          });
          if (userIndex == -1) {
            //user not in the entities list
            let playercontrolled;
            if (user.id == this.userId) playercontrolled = true;
            else playercontrolled = false;

            const newEntity = playerEntity.create(user.id, [user.position.x, user.position.y], user.color, playercontrolled);
            if (playercontrolled) this.camera?.follow(newEntity);
            this.camera?.entities.push(newEntity);
          }
        });
        break;
      case "debug":
        console.log("DEBUG MESSAGE FROM SERVER", message.data);

        break;
      case "weaponstrike":
        //get weaponstrike data
        console.log(message.msg);

        let { sid, playerId, weapon, direction } = message.msg;
        //find playerindex in entities
        const playerIndex = this.entities.findIndex((ent: any) => ent.name == playerId);
        if (playerIndex < 0) return;
        //add weapon entity
        this.entities.push(
          weaponEntity.create(
            sid,
            weapon,
            this.entities[playerIndex].position,
            this.entities[playerIndex].velocity,
            direction,
            "engaged"
          )
        );
        break;
      case "addEnemy": {
        //get weaponstrike data

        let { sid, state, position, direction } = message.entity;

        //add enemy entity
        this.entities.push(enemyEntity.create(new Vector(position.x, position.y), sid, state, direction));
        break;
      }
      case "UIevent":
        console.log("UIevent", message.msg);

        if (message.msg == "removeCages") {
          for (let index = this.entities.length - 1; index >= 0; index--) {
            if (this.entities[index].type == "cage") {
              this.entities.splice(index, 1);
            }
          }
        } else if (message.msg == "removekey") {
          for (let index = this.entities.length - 1; index >= 0; index--) {
            if (this.entities[index].type == "key") {
              this.entities.splice(index, 1);
            }
          }
        } else if (message.msg == "openDoor") {
          //get exit entity

          const rslt = this.entities.filter((ent: any) => {
            return ent.type == "exit";
          });
          console.log(rslt);

          rslt[0].sprites[0].currentSequence = "unlocked";
        } else if (message.msg == "removeclub") {
          for (let index = this.entities.length - 1; index >= 0; index--) {
            if (this.entities[index].type == "club") {
              this.entities.splice(index, 1);
            }
          }
        } else if (message.msg == "removeknife") {
          for (let index = this.entities.length - 1; index >= 0; index--) {
            if (this.entities[index].type == "knife") {
              this.entities.splice(index, 1);
            }
          }
        } else if (message.msg == "removerock") {
          for (let index = this.entities.length - 1; index >= 0; index--) {
            if (this.entities[index].type == "rock") {
              this.entities.splice(index, 1);
            }
          }
        } else if (message.msg == "removewhip") {
          for (let index = this.entities.length - 1; index >= 0; index--) {
            if (this.entities[index].type == "whip") {
              this.entities.splice(index, 1);
            }
          }
        }

        break;
      case "stateupdate":
        this.firstUpdate = updateState(this.firstUpdate, this.entities, this.camera as Camera, message.state, this.userId) as boolean;
        this.state = message.state;
        this.hud.stateUpdate(this.state);
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

    //cages
    state.cages.forEach((cage: { id: string; position: Vector; velocity: Vector; angle: number }) => {
      camera.entities.push(cageEntity.create(cage));
    });
    console.log("entity check: ", camera.entities);

    //exit
    camera.entities.push(exitEntity.create(state.exit));
    console.log("exit", state.exit);

    //key
    camera.entities.push(keyEntity.create(state.key.location));
    console.log("key", state.key);

    //generators
    console.log("generators: ", state.generators);
    state.generators.forEach((gen: any) => camera.entities.push(GeneratorEntity.create(gen.position, gen.sid)));

    //weapons
    console.log("state weapons", state.weapons);

    state.weapons.forEach((weap: any) => {
      console.log("creating weapon: ", weap);

      camera.entities.push(
        weaponEntity.create(weap.sid, weap.type, new Vector(weap.position.x, weap.position.y), new Vector(0, 0), "down", "onground")
      );
    });

    //players
    state.players.forEach((player: any) => {
      console.log("first update", player.position.x, player.position.y);
      addEntity(camera, player, userid);
    });
    console.log(camera.entities);

    return false;
  }
  entities.forEach((entity: any) => {
    //find entity in state
    let entIndex;

    switch (entity.type) {
      case "player":
        entIndex = state.players.findIndex((player: any) => player.id == entity.name);
        if (entIndex >= 0) {
          entity.position = state.players[entIndex].position;
        }
        break;
      case "cage":
        entIndex = state.cages.findIndex((cage: any) => {
          return cage.id == entity.sid;
        });

        if (entIndex >= 0) {
          entity.position = state.cages[entIndex].position;
          entity.angVelocity = state.cages[entIndex].angleVelocity;
          //console.log("rotating cage? ", entity.angVelocity);
        }
        break;
      case "knife":
      case "club":
      case "rock":
      case "whip":
        entIndex = state.weapons.findIndex((weapon: any) => {
          return weapon.sid == entity.sid;
        });
        //console.log(entity, entIndex, state.weapons);
        if (entIndex >= 0) {
          entity.position = state.weapons[entIndex].position;
        }

        break;
      case "enemy":
        entIndex = state.enemies.findIndex((en: any) => {
          return en.sid == entity.sid;
        });
        console.log("enemy index: ", entIndex, entity.sid, state.enemies);

        //console.log(entity, entIndex, state.weapons);
        if (entIndex >= 0) {
          console.log("enemey position update", state.enemies[entIndex].position);
          entity.position = state.enemies[entIndex].position;
        }
        break;
    }
  });
}

function addEntity(camera: Camera, player: any, id: string) {
  let playercontrolled;

  if (player.id == id) playercontrolled = true;
  else playercontrolled = false;

  const newEntity = playerEntity.create(player.id, [player.position.x, player.position.y], player.color, playercontrolled);
  if (playercontrolled) camera?.follow(newEntity);
  camera?.entities.push(newEntity);
}
