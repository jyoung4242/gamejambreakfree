import { Application, RoomId, startServer, UserId, verifyJwt } from "@hathora/server-sdk";
import * as dotenv from "dotenv";
import { LevelMaker } from "../serversideLevelMaker.ts";
import { Vector } from "../../_SqueletoECS/Vector.ts";
import { gamestates } from "../projecttypes.ts";
import { System, Box, deg2rad } from "detect-collisions";
//@ts-ignore
import Chance from "chance";
//@ts-ignore
import { v4 as uuidv4 } from "uuid";

dotenv.config();
const chance = new Chance();

enum collisionBodyType {
  player = "player",
  wall = "wall",
  cage = "cage",
  exit = "exit",
  key = "key",
  club = "club",
  knife = "knife",
  rock = "rock",
  whip = "whip",
  enemy = "enemy",
  generator = "generator",
}

type colliderBody = Box & { cBody: collisionBodyType };

const startingpattern = [
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
];

let currentMap: Array<Array<number>> = [];
type direction = "right" | "up" | "left" | "down" | "none";

type InternalState = {
  dc: System;
  map: Array<Array<number>> | undefined;
  startingCoords: [number, number];
  players: InternalPlayer[];
  weapons: colliderBody[];
  capacity: number;
  gameState: gamestates;
  cages: { id: string; position: Vector; velocity: Vector; body: colliderBody; angleVelocity: number }[];
  exit: Vector;
  exitCoords: number[];
  keyCoords: number[];
  generators: colliderBody[];
  key: {
    location: Vector;
    status: "available" | "taken";
  };
  enemyGenTik: number;
  enemyGenTrigger: number;
  enemies: colliderBody[];
};

export enum enemyState {
  idle = "idle",
  scanning = "scanning",
  patrol = "patrol",
  attack = "attack",
  damage = "damage",
  moving = "moving",
}

export enum weaponType {
  knife = "knife",
  whip = "whip",
  club = "club",
  rock = "rock",
  spear = "spear",
  machete = "machete",
  none = "none",
}

/**************************
 * Game State types
 *************************/
type InternalPlayer = {
  id: UserId;
  colliderBody: colliderBody;

  direction: direction;
  status: "idle" | "walk";
  velocity: Vector;
  color: string;
  inventory: {
    possesKey: boolean;
    weapon: weaponType;
  };
};

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");
const rooms: Map<RoomId, InternalState> = new Map();

const app: Application = {
  verifyToken: (token: string, roomId: string): Promise<UserId | undefined> => {
    return new Promise((resolve, reject) => {
      const result = verifyJwt(token, process.env.HATHORA_APP_SECRET as string);

      if (result) resolve(result);
      else reject();
    });
  },
  subscribeUser: (roomId: RoomId, userId: UserId): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      /*************************************************
       * If room doesn't exist, create it and add to map
       ************************************************/
      let bankOfCoords;
      if (!rooms.has(roomId)) {
        let tempDC = new System();
        console.log("creating room");
        let mapdata:
          | {
              map: any[];
              coords: [number, number];
              exit: number[];
              key: number[];
              w1: number[];
              w2: number[];
              w3: number[];
              w4: number[];
              g1: number[];
              g2: number[];
            }
          | undefined
          | null;
        do {
          mapdata = await generateNewMap();
        } while (!mapdata);

        //findEdgeCoordinates and add to collision system
        bankOfCoords = findEdgeCoordinates(mapdata.map);
        addTilesToCollisionSystem(bankOfCoords, tempDC);

        let cages: { id: string; position: Vector; velocity: Vector; body: colliderBody; angleVelocity: number }[] = [];
        let thisCage = {
          id: uuidv4(),
          position: new Vector(mapdata.coords[0] * 16, mapdata.coords[1] * 16),
          velocity: new Vector(0, 0),
          body: createCageBody(new Vector(mapdata.coords[0] * 16, mapdata.coords[1] * 16)),
          angleVelocity: 0,
        };
        cages.push(thisCage);
        tempDC.insert(thisCage.body);
        thisCage = {
          id: uuidv4(),
          position: new Vector((mapdata.coords[0] + 1) * 16, mapdata.coords[1] * 16),
          velocity: new Vector(0, 0),
          body: createCageBody(new Vector((mapdata.coords[0] + 1) * 16, mapdata.coords[1] * 16)),
          angleVelocity: 0,
        };
        cages.push(thisCage);
        tempDC.insert(thisCage.body);
        thisCage = {
          id: uuidv4(),
          position: new Vector((mapdata.coords[0] + 2) * 16, mapdata.coords[1] * 16),
          velocity: new Vector(0, 0),
          body: createCageBody(new Vector((mapdata.coords[0] + 2) * 16, mapdata.coords[1] * 16)),
          angleVelocity: 0,
        };
        cages.push(thisCage);
        tempDC.insert(thisCage.body);
        thisCage = {
          id: uuidv4(),
          position: new Vector((mapdata.coords[0] + 3) * 16, mapdata.coords[1] * 16),
          angleVelocity: 0,
          velocity: new Vector(0, 0),
          body: createCageBody(new Vector((mapdata.coords[0] + 3) * 16, mapdata.coords[1] * 16)),
        };
        cages.push(thisCage);
        tempDC.insert(thisCage.body);
        thisCage = {
          id: uuidv4(),
          position: new Vector(mapdata.coords[0] * 16, (mapdata.coords[1] + 1) * 16),
          velocity: new Vector(0, 0),
          body: createCageBody(new Vector(mapdata.coords[0] * 16, (mapdata.coords[1] + 1) * 16)),
          angleVelocity: 0,
        };
        cages.push(thisCage);
        tempDC.insert(thisCage.body);
        thisCage = {
          id: uuidv4(),
          position: new Vector((mapdata.coords[0] + 3) * 16, (mapdata.coords[1] + 1) * 16),
          angleVelocity: 0,
          velocity: new Vector(0, 0),
          body: createCageBody(new Vector((mapdata.coords[0] + 3) * 16, (mapdata.coords[1] + 1) * 16)),
        };
        cages.push(thisCage);
        tempDC.insert(thisCage.body);
        thisCage = {
          id: uuidv4(),
          position: new Vector(mapdata.coords[0] * 16, (mapdata.coords[1] + 2) * 16),
          velocity: new Vector(0, 0),
          body: createCageBody(new Vector(mapdata.coords[0] * 16, (mapdata.coords[1] + 2) * 16)),
          angleVelocity: 0,
        };
        cages.push(thisCage);
        tempDC.insert(thisCage.body);
        thisCage = {
          id: uuidv4(),
          position: new Vector((mapdata.coords[0] + 3) * 16, (mapdata.coords[1] + 2) * 16),
          velocity: new Vector(0, 0),
          body: createCageBody(new Vector((mapdata.coords[0] + 3) * 16, (mapdata.coords[1] + 2) * 16)),
          angleVelocity: 0,
        };
        cages.push(thisCage);
        tempDC.insert(thisCage.body);
        thisCage = {
          id: uuidv4(),
          position: new Vector(mapdata.coords[0] * 16, (mapdata.coords[1] + 3) * 16),
          velocity: new Vector(0, 0),
          body: createCageBody(new Vector(mapdata.coords[0] * 16, (mapdata.coords[1] + 3) * 16)),
          angleVelocity: 0,
        };
        cages.push(thisCage);
        tempDC.insert(thisCage.body);

        thisCage = {
          id: uuidv4(),
          position: new Vector((mapdata.coords[0] + 1) * 16, (mapdata.coords[1] + 3) * 16),
          velocity: new Vector(0, 0),
          body: createCageBody(new Vector((mapdata.coords[0] + 1) * 16, (mapdata.coords[1] + 3) * 16)),
          angleVelocity: 0,
        };
        cages.push(thisCage);
        tempDC.insert(thisCage.body);

        thisCage = {
          id: uuidv4(),
          position: new Vector((mapdata.coords[0] + 2) * 16, (mapdata.coords[1] + 3) * 16),
          angleVelocity: 0,
          velocity: new Vector(0, 0),
          body: createCageBody(new Vector((mapdata.coords[0] + 2) * 16, (mapdata.coords[1] + 3) * 16)),
        };
        cages.push(thisCage);
        tempDC.insert(thisCage.body);

        thisCage = {
          id: uuidv4(),
          position: new Vector((mapdata.coords[0] + 3) * 16, (mapdata.coords[1] + 3) * 16),
          velocity: new Vector(0, 0),
          body: createCageBody(new Vector((mapdata.coords[0] + 3) * 16, (mapdata.coords[1] + 3) * 16)),
          angleVelocity: 0,
        };
        cages.push(thisCage);
        tempDC.insert(thisCage.body);

        console.log("starting coord: ", mapdata.coords);

        //Creating Exit entity
        let myExit;
        if (mapdata.exit) myExit = createExitBody(new Vector(mapdata.exit[0] * 16, mapdata.exit[1] * 16));
        tempDC.insert(myExit as colliderBody);

        //Creating Key entity
        let myKey;
        if (mapdata.key) myKey = createKeyBody(new Vector(mapdata.key[0] * 16, mapdata.key[1] * 16));
        tempDC.insert(myKey as colliderBody);

        //Creating weapon entity
        let myW1;

        if (mapdata.key) myW1 = createClubBody(new Vector(mapdata.w1[0] * 16, mapdata.w1[1] * 16), new Vector(0, 0), false);
        tempDC.insert(myW1 as colliderBody);

        //Creating weapon entity
        let myW2;

        if (mapdata.key) myW2 = createKniveBody(new Vector(mapdata.w2[0] * 16, mapdata.w2[1] * 16), new Vector(0, 0), false);
        tempDC.insert(myW2 as colliderBody);

        //Creating weapon entity
        let myW3;

        if (mapdata.key) myW3 = createRockBody(new Vector(mapdata.w3[0] * 16, mapdata.w3[1] * 16), new Vector(0, 0), false);
        tempDC.insert(myW3 as colliderBody);

        //Creating weapon entity
        let myW4;

        if (mapdata.key) myW4 = createWhipBody(new Vector(mapdata.w4[0] * 16, mapdata.w4[1] * 16), new Vector(0, 0), false);
        tempDC.insert(myW4 as colliderBody);

        let weaps = [myW1, myW2, myW3, myW4];

        //Creating generator entity
        let g1, g2;

        if (mapdata.key)
          g1 = createEnemyGeneratorBody(new Vector(mapdata.g1[0] * 16, mapdata.g1[1] * 16), [mapdata.g1[0], mapdata.g1[1]]);
        tempDC.insert(g1 as colliderBody);

        if (mapdata.key)
          g2 = createEnemyGeneratorBody(new Vector(mapdata.g2[0] * 16, mapdata.g2[1] * 16), [mapdata.g2[0], mapdata.g2[1]]);
        tempDC.insert(g2 as colliderBody);

        let newRoomState: InternalState = {
          dc: tempDC,
          exitCoords: [...mapdata.exit],
          keyCoords: [...mapdata.key],
          players: [],
          weapons: [...weaps] as colliderBody[],
          capacity: 4,
          map: mapdata?.map,
          enemyGenTik: 0,
          enemyGenTrigger: 25,
          enemies: [],
          startingCoords: mapdata.coords,
          gameState: gamestates.prestart,
          cages: [...cages],
          generators: [g1 as colliderBody, g2 as colliderBody],
          //@ts-ignore
          exit: new Vector(mapdata.exit[0] * 16, mapdata.exit[1] * 16),

          key: {
            //@ts-ignore
            location: new Vector(mapdata.key[0] * 16, mapdata.key[1] * 16),
            status: "available",
          },
        };
        rooms.set(roomId, newRoomState);
      }

      /*************************************************
      //check to make sure user not in room
      *************************************************/
      const game = rooms.get(roomId);
      const findResult = game?.players.findIndex(user => user.id === userId);
      if (findResult != -1) {
        server.sendMessage(
          roomId,
          userId,
          encoder.encode(
            JSON.stringify({
              type: "ERROR",
              message: `user: ${userId} is already in room ${roomId}`,
            })
          )
        );
        reject();
      }

      /*****************************************
       * if player limit not exceeded, proceed
       ****************************************/
      if (game?.players.length == game?.capacity) {
        /****************
         * Error handling
         ***************/
        console.warn("Current room at max capacity");
        server.closeConnection(roomId, userId, "Current room at max capacity");
        return;
      }

      let playerNum;
      if (game?.players) {
        playerNum = game.players.length + 1;
      }

      let startingVector: Vector;
      let myColor: string;
      if (game?.startingCoords) {
        switch (playerNum) {
          case 1:
            startingVector = new Vector((game?.startingCoords[0] + 1) * 16, (game?.startingCoords[1] + 1) * 16);
            myColor = "blue";
            break;
          case 2:
            startingVector = new Vector((game?.startingCoords[0] + 2) * 16, (game?.startingCoords[1] + 1) * 16);
            myColor = "red";
            break;
          case 3:
            startingVector = new Vector((game?.startingCoords[0] + 1) * 16, (game?.startingCoords[1] + 2) * 16);
            myColor = "yellow";
            break;
          case 4:
            startingVector = new Vector((game?.startingCoords[0] + 2) * 16, (game?.startingCoords[1] + 2) * 16);
            myColor = "green";
            break;
          default:
            startingVector = new Vector((game?.startingCoords[0] + 1) * 16, (game?.startingCoords[1] + 1) * 16);
            myColor = "blue";
            break;
        }
      } else {
        startingVector = new Vector(0, 0);
        myColor = "blue";
      }

      const cbody = createPlayerBody(startingVector);
      const newPlayer: InternalPlayer = {
        id: userId,
        direction: "none",
        velocity: new Vector(0, 0),
        status: "idle",
        color: myColor,
        colliderBody: cbody,
        inventory: {
          possesKey: false,
          weapon: weaponType.none,
        },
      };
      game?.dc.insert(cbody);
      game?.players.push(newPlayer);

      server.broadcastMessage(
        roomId,
        encoder.encode(
          JSON.stringify({
            type: "USERLIST",
            roomID: roomId,
            users: game?.players.map(plr => {
              return {
                id: plr.id,
                direction: plr.direction,
                status: plr.status,
                position: plr.colliderBody.pos,
                color: plr.color,
              };
            }),
          })
        )
      );
      //console.log("sending debug data");
      server.sendMessage(roomId, userId, encoder.encode(JSON.stringify({ type: "debug", data: bankOfCoords })));
      resolve();
    });
  },
  unsubscribeUser: (roomId: RoomId, userId: UserId): Promise<void> => {
    return new Promise((resolve, reject) => {
      /***********************
       * Check for valid room
       ***********************/
      if (!rooms.has(roomId)) {
        return;
      }

      /*********************
       * Get room gamestate
       *********************/
      const game = rooms.get(roomId);

      /********************************
       * Find the player in gamestate
       * remove them from the game
       *******************************/
      const plrIndex = game?.players.findIndex(plr => plr.id == userId);
      if ((plrIndex as number) >= 0) {
        //broadcast new user to all players
        const leftMessage = {
          type: "userLeftServer",
          playerID: userId,
        };
        console.log("player leaving");

        server.broadcastMessage(roomId, encoder.encode(JSON.stringify(leftMessage)));
        game?.players.splice(plrIndex as number, 1);
      }

      //cleanup
      if (game?.players.length == 0) {
        game.gameState == gamestates.gameover;
        game.enemies = [];
      }

      resolve();
    });
  },

  /*
    The onMessage is the callback that manages all the clients messages to the server, this is where a bulk of your server code goes regarding
    responding to the client's messages
  */

  onMessage: (roomId: RoomId, userId: UserId, data: ArrayBuffer): Promise<void> => {
    return new Promise(async resolve => {
      const msg = JSON.parse(decoder.decode(data));

      let game: any;
      let playerIndex: any;
      switch (msg.type) {
        case "sendMap":
          await handleMapRequest(roomId, userId);
          break;
        case "statechange":
          //console.log("gamestate update from : ", userId, " in room ", roomId, ", new state: ", msg);
          //confirm room
          game = rooms.get(roomId);
          if (game == undefined) return;

          if (game.gameState == gamestates.prestart) {
            game.gameState = gamestates.startingbanner;
            setTimeout(() => {
              game.gameState = gamestates.running;
              setTimeout(() => {
                startBreakOut(game, roomId);
              }, 1000);
            }, 2000);
          }

          break;
        case "weapon remove":
          game = rooms.get(roomId);
          if (game == undefined) return;
          const wid = msg.msg;
          const windex = game.weapons.findIndex((w: any) => w.sid == wid);
          game.dc.remove(game.weapons[windex]);
          game.weapons.splice(windex, 1);

          break;
        case "weaponEngage":
          //console.log(`${userId} from room ${roomId} firing weapon`);

          game = rooms.get(roomId);
          if (game == undefined) return;
          playerIndex = game.players.findIndex((player: any) => player.id == userId);
          if (game.players[playerIndex].inventory.weapon == weaponType.none) return;

          let currentWeapon;
          let myPosition = new Vector(0, 0);
          let knifeVelocity;
          let currentposition = game.players[playerIndex].colliderBody.pos;
          switch (game.players[playerIndex].direction) {
            case "left":
              myPosition = new Vector(currentposition.x - 24, currentposition.y - 8);
              knifeVelocity = new Vector(-10, 0);
              break;
            case "right":
              myPosition = new Vector(currentposition.x + 8, currentposition.y - 8);
              //myPosition = currentposition.add(new Vector(8, -8));
              knifeVelocity = new Vector(10, 0);
              break;
            case "down":
              myPosition = new Vector(currentposition.x - 8, currentposition.y + 8);
              //myPosition = currentposition.add(new Vector(-8, 8));
              knifeVelocity = new Vector(0, 10);
              break;
            case "up":
              myPosition = new Vector(currentposition.x - 8, currentposition.y - 24);
              // myPosition = currentposition.add(new Vector(-8, -24));
              knifeVelocity = new Vector(0, -10);
              break;
            default:
              knifeVelocity = new Vector(0, 0);
          }
          //console.log(game.players[playerIndex].inventory.weapon);

          switch (game.players[playerIndex].inventory.weapon) {
            case weaponType.club:
              currentWeapon = createClubBody(myPosition, game.players[playerIndex].velocity, true);
              break;
            case weaponType.knife:
              //console.log("creating knive body");
              currentWeapon = createKniveBody(myPosition, knifeVelocity, true);
              break;
            case weaponType.rock:
              //console.log("creating knive body");
              currentWeapon = createRockBody(myPosition, knifeVelocity, true);

              break;
            case weaponType.whip:
              //console.log("creating knive body");
              currentWeapon = createWhipBody(myPosition, game.players[playerIndex].velocity, true);

              break;
          }
          game.dc.insert(currentWeapon);
          game.weapons.push(currentWeapon);
          //tell everyone that your firing weapon
          //console.log("broadcasting; ", game.players[playerIndex]);

          server.broadcastMessage(
            roomId,
            encoder.encode(
              JSON.stringify({
                type: "weaponstrike",
                msg: {
                  //@ts-ignore
                  sid: currentWeapon.sid,
                  playerId: game.players[playerIndex].id,
                  //@ts-ignore
                  weapon: currentWeapon.cBody,
                  //@ts-ignore
                  status: currentWeapon.status,
                  //@ts-ignore
                  position: currentWeapon.pos,
                  direction: game.players[playerIndex].direction,
                },
              })
            )
          );

          break;
        case "DirectionUpdate":
          //console.log("direction update from : ", userId, " in room ", roomId, "and pressed ", msg);
          //confirm room
          game = rooms.get(roomId);
          if (game == undefined) return;

          playerIndex = game.players.findIndex((player: any) => player.id == userId);
          if ((playerIndex as number) >= 0 && game) {
            if (msg.msg != "none") {
              game.players[playerIndex as number].direction = msg.msg;
              game.players[playerIndex as number].status = "walk";
            } else {
              game.players[playerIndex as number].status = "idle";
            }
          }
          break;
        default:
          server.sendMessage(
            roomId,
            userId,
            encoder.encode(
              JSON.stringify({
                type: "SERVERMESSAGE",
                msg: "HELLO FROM SERVER",
              })
            )
          );

          break;
      }

      resolve();
    });
  },
};

const port = 9000;
const server = await startServer(app, port);
console.log(`Hathora Server listening on port ${port}`);
console.log(`Firing up physics system`);

setInterval(() => {
  rooms.forEach((room, key) => {
    //******************* */
    //Monster Gen Tik
    //*********************/
    if (room.gameState == gamestates.running) room.enemyGenTik++;
    if (room.enemyGenTik >= room.enemyGenTrigger) {
      console.log("triggering monster gen");

      room.enemyGenTik = 0;
      //generate enemy
      if (room.enemies.length < 1) {
        room.generators.forEach((gen: any) => {
          const tempVector = new Vector(gen.pos.x, gen.pos.y);
          const randomVectors = generateRandomVectors(tempVector);
          for (let index = 0; index < randomVectors.length; index++) {
            const thisVector = randomVectors[index];
            const startingVector = tempVector.add(thisVector);
            const endingVector = startingVector.add(thisVector);
            const hit = room.dc.raycast(startingVector, endingVector);

            if (hit) {
              continue;
            } else {
              //generate enemy here
              const myEnemy = createEnemyBody(startingVector, gen.coords);
              room.enemies.push(myEnemy);
              room.dc.insert(myEnemy);
              server.broadcastMessage(
                key,
                encoder.encode(
                  JSON.stringify({
                    type: "addEnemy",
                    entity: {
                      position: myEnemy.pos,
                      //@ts-ignore
                      state: myEnemy.state,
                      //@ts-ignore
                      direction: myEnemy.direction,
                      //@ts-ignore
                      sid: myEnemy.sid,
                    },
                  })
                )
              );
              break;
            }
          }
        });
      }
    }

    //******************* */
    //Enemy AI
    //******************* */

    room.enemies.forEach((en: any) => {
      //@ts-ignore
      switch (en.state as enemyState) {
        case enemyState.idle:
          // console.log(`${en.sid} in Idle state`);

          if (en.AIlimit == 0) {
            //initialization of AI
            en.AIlimit = 20;
            en.AItik = 0;
          }
          en.AItik++;

          if (en.AItik >= en.AIlimit) {
            //switch states
            //idle --> scanning
            en.state = enemyState.scanning;
            en.AItik = 0;
            en.AIlimit = 12;
          }
          break;
        case enemyState.scanning:
          //console.log(`${en.sid} in scanning state`);
          if (en.AIlimit == 0) {
            //initialization of AI
            en.AIlimit = 12;
            en.AItik = 0;
          }
          en.AItik++;

          //while waiting to scan, change directions
          if (en.AItik <= 3) {
            en.direction = "down";
          } else if (en.AItik > 3 && en.AItik <= 6) {
            en.direction = "left";
          } else if (en.AItik > 6 && en.AItik <= 9) {
            en.direction = "up";
          } else {
            en.direction = "right";
          }

          if (en.AItik >= en.AIlimit) {
            en.direction = "down";
            //scan routine, and make decision
            //get distance to each player
            //console.log(`${en.sid} scanning for playres`);
            room.players.forEach(plr => {
              //get magnitud of difference Vector
              //console.log("Player Scan");

              const VecA: Vector = new Vector(plr.colliderBody.pos.x, plr.colliderBody.pos.y);
              const VecB: Vector = new Vector(en.pos.x, en.pos.y);
              const distance = VecA.subtract(VecB).magnitude;

              //console.log("Vector summary: ", VecA, VecB, distance);

              if (distance > 150) {
                return;
              }

              // player close enough, is in line of sight?
              const hit = room.dc.raycast(VecA, VecB);
              if (hit) {
                //console.log(`${en.sid} found player`);
                //player seen, attack!!!!
                // if players nearby LOS --> attack
                en.target = plr;
                en.state = enemyState.attack;
                en.AItik = 0;
                en.AIlimit = 5;
                return;
              }
            });
            // if no players nearby --> patrol
            // just looped through all the players, so we go on patrol
            // console.log(`${en.sid} no found player, patrolling`);
            en.state = enemyState.patrol;
            en.AItik = 0;
            en.AIlimit = 5;
          }
          break;
        case enemyState.patrol:
          console.log(`${en.sid} IN patrol!!!!`);
          //choose random spot near either door or key
          const tempVector = new Vector(en.pos.x, en.pos.y);
          const randomVectors = generateRandomVectors(tempVector);
          for (let index = 0; index < randomVectors.length; index++) {
            const thisVector = randomVectors[index];
            const startingVector = tempVector.add(thisVector);
            const endingVector = startingVector.add(thisVector);
            const hit = room.dc.raycast(startingVector, endingVector);

            if (hit) {
              continue;
            } else {
              //move to ending Vector
              en.state = enemyState.moving;
              en.destinationVector = endingVector;
              console.log(`${en.sid} found open spot`);
              break;
            }
          }

          break;
        case enemyState.moving:
          //console.log(`${en.sid} --> moving`);
          let movementVector = en.destinationVector.subtract(new Vector(en.pos.x, en.pos.y));
          console.log(
            `${en.sid} --> Vectors: ${en.destinationVector.x}, ${en.destinationVector.y} and current position: ${en.pos.x},${en.pos.y}`
          );
          console.log(`${en.sid} --> moving Vector: ${movementVector.x}, ${movementVector.y}`);
          //clean movement
          movementVector = new Vector(Math.floor(movementVector.x), Math.floor(movementVector.y));
          let deltax = 0,
            deltay = 0;

          //test for arriving at location
          if (movementVector.x == 0 && movementVector.y == 0) {
            //arrived!
            en.state = enemyState.idle;
            en.AItik = 0;
            en.AIlimit = 20;
            break;
          }

          if (movementVector.x > 0) deltax = 1;
          else if (movementVector.x < 0) deltax = -1;
          if (movementVector.y > 0) deltay = 1;
          else if (movementVector.y < 0) deltay = -1;
          console.log(`${en.sid} --> updated position: ${en.pos.x + deltax}, ${en.pos.y + deltay}`);
          en.setPosition(en.pos.x + deltax, en.pos.y + deltay);

          break;
        case enemyState.attack:
          console.log(`${en.sid} is attacking ${en.target.sid}`);
          break;
        case enemyState.damage:
          break;
      }
    });

    //***************** */
    //Collision Check/mgmt
    //***************** */

    room.dc.checkAll(response => {
      let { a, b, overlapV } = response;

      if ((a as colliderBody).cBody == collisionBodyType.player && (b as colliderBody).cBody == collisionBodyType.wall) {
        //player and wall
        a.x -= overlapV.x;
        a.y -= overlapV.y;
      } else if ((a as colliderBody).cBody == collisionBodyType.player && (b as colliderBody).cBody == collisionBodyType.player) {
        //player and player
        //console.log("p/p collision: ");

        b.x += overlapV.x;
        b.y += overlapV.y;
      } else if ((a as colliderBody).cBody == collisionBodyType.player && (b as colliderBody).cBody == collisionBodyType.cage) {
        //player and cage
        //console.log("cage collision");

        a.x -= overlapV.x;
        a.y -= overlapV.y;
      } else if ((a as colliderBody).cBody == collisionBodyType.player && (b as colliderBody).cBody == collisionBodyType.exit) {
        //player and cage
        //console.log("exit collision");
        a.x -= overlapV.x;
        a.y -= overlapV.y;

        //get player index
        const plrindex = room.players.findIndex(plr => plr.colliderBody == a);
        if (plrindex >= 0 && room.players[plrindex].inventory.possesKey == true) {
          //open door
          server.broadcastMessage(
            key,
            encoder.encode(
              JSON.stringify({
                type: "UIevent",
                msg: "openDoor",
              })
            )
          );
        }
      } else if ((a as colliderBody).cBody == collisionBodyType.player && (b as colliderBody).cBody == collisionBodyType.key) {
        if (room.key.status == "available") {
          room.key.status = "taken";

          //get player index
          const plrindex = room.players.findIndex(plr => plr.colliderBody == a);
          if (plrindex >= 0) {
            room.players[plrindex].inventory.possesKey = true;
          }

          server.broadcastMessage(
            key,
            encoder.encode(
              JSON.stringify({
                type: "UIevent",
                msg: "removekey",
              })
            )
          );
        }
      } else if ((a as colliderBody).cBody == collisionBodyType.player && (b as colliderBody).cBody == collisionBodyType.club) {
        //get player index

        const plrindex = room.players.findIndex(plr => plr.colliderBody == a);
        //console.log(room.players[plrindex].inventory.weapon);

        if (plrindex >= 0 && room.players[plrindex].inventory.weapon == weaponType.none) {
          //pick up weapon
          room.players[plrindex].inventory.weapon = weaponType.club;
          room.dc.remove(b);
          server.broadcastMessage(
            key,
            encoder.encode(
              JSON.stringify({
                type: "UIevent",
                msg: "removeclub",
              })
            )
          );
        }
      } else if ((a as colliderBody).cBody == collisionBodyType.player && (b as colliderBody).cBody == collisionBodyType.knife) {
        //get player index
        const plrindex = room.players.findIndex(plr => plr.colliderBody == a);
        //console.log(room.players[plrindex].inventory.weapon);
        if (plrindex >= 0 && room.players[plrindex].inventory.weapon == weaponType.none) {
          //pick up weapon
          room.dc.remove(b);
          room.players[plrindex].inventory.weapon = weaponType.knife;
          server.broadcastMessage(
            key,
            encoder.encode(
              JSON.stringify({
                type: "UIevent",
                msg: "removeknife",
              })
            )
          );
        }
      } else if ((a as colliderBody).cBody == collisionBodyType.knife && (b as colliderBody).cBody == collisionBodyType.wall) {
        if (a.status == "onground") return;
        //get player index
        // console.log("knife hit wall");

        const windex = room.weapons.findIndex(w => w == a);
        //knife hit wall, remove entity
        room.weapons.splice(windex, 1);
        room.dc.remove(a);
        server.broadcastMessage(
          key,
          encoder.encode(
            JSON.stringify({
              type: "UIevent",
              msg: "removeknife",
            })
          )
        );
      } else if ((a as colliderBody).cBody == collisionBodyType.player && (b as colliderBody).cBody == collisionBodyType.rock) {
        //get player index
        const plrindex = room.players.findIndex(plr => plr.colliderBody == a);
        //console.log(room.players[plrindex].inventory.weapon);
        if (plrindex >= 0 && room.players[plrindex].inventory.weapon == weaponType.none) {
          //pick up weapon
          //console.log("removing", b);

          //find index in room.weapons
          const windex = room.weapons.findIndex(w => w == b);

          if (windex < 0) return;
          room.weapons.splice(windex, 1);
          room.dc.remove(b);

          room.players[plrindex].inventory.weapon = weaponType.rock;
          server.broadcastMessage(
            key,
            encoder.encode(
              JSON.stringify({
                type: "UIevent",
                msg: "removerock",
              })
            )
          );
        }
      } else if ((a as colliderBody).cBody == collisionBodyType.rock && (b as colliderBody).cBody == collisionBodyType.wall) {
        if (a.status == "onground") return;
        //get player index
        //("rock hit wall");

        const windex = room.weapons.findIndex(w => w == a);
        //knife hit wall, remove entity
        room.weapons.splice(windex, 1);
        room.dc.remove(a);
        server.broadcastMessage(
          key,
          encoder.encode(
            JSON.stringify({
              type: "UIevent",
              msg: "removerock",
            })
          )
        );
      } else if ((a as colliderBody).cBody == collisionBodyType.player && (b as colliderBody).cBody == collisionBodyType.whip) {
        //get player index
        const plrindex = room.players.findIndex(plr => plr.colliderBody == a);

        if (plrindex >= 0 && room.players[plrindex].inventory.weapon == weaponType.none) {
          //pick up weapon
          //console.log("removing", b);

          //find index in room.weapons
          const windex = room.weapons.findIndex(w => w == b);

          if (windex < 0) return;
          room.weapons.splice(windex, 1);
          room.dc.remove(b);

          room.players[plrindex].inventory.weapon = weaponType.whip;
          server.broadcastMessage(
            key,
            encoder.encode(
              JSON.stringify({
                type: "UIevent",
                msg: "removewhip",
              })
            )
          );
        }
      } else if ((a as colliderBody).cBody == collisionBodyType.player && (b as colliderBody).cBody == collisionBodyType.generator) {
        //player and wall
        //console.log("collision with generator");

        a.x -= overlapV.x;
        a.y -= overlapV.y;
      } else {
        //console.log("collision", a, b);
      }
    });

    //****************
    //update positions
    //****************
    if (room.players.length >= 1) {
      room.players.forEach(player => {
        if (player.status == "walk") {
          switch (player.direction) {
            case "down":
              player.velocity.y = 5;
              player.velocity.x = 0;
              break;
            case "up":
              player.velocity.y = -5;
              player.velocity.x = 0;
              break;
            case "left":
              player.velocity.x = -5;
              player.velocity.y = 0;
              break;
            case "right":
              player.velocity.x = 5;
              player.velocity.y = 0;
              break;
          }
        } else {
          player.velocity.x = 0;
          player.velocity.y = 0;
        }

        //player.position = player.position.add(player.velocity);
        player.colliderBody.setPosition(
          (player.colliderBody.pos.x += player.velocity.x),
          (player.colliderBody.pos.y += player.velocity.y)
        );
      });
    }
    if (room.cages.length >= 1) {
      room.cages.forEach(cage => {
        cage.position = cage.position.add(cage.velocity);
      });
    }

    if (room.weapons.length >= 1) {
      let posx, posy;
      room.weapons.forEach((weapon, index) => {
        switch (weapon.cBody) {
          case collisionBodyType.club:
            //@ts-ignore
            posx = weapon.pos.x += weapon.velocity.x;
            //@ts-ignore
            posy = weapon.pos.y += weapon.velocity.y;
            weapon.setPosition(posx, posy);
            break;
          case collisionBodyType.knife:
            //@ts-ignore
            posx = weapon.pos.x += weapon.velocity.x;
            //@ts-ignore
            posy = weapon.pos.y += weapon.velocity.y;
            weapon.setPosition(posx, posy);
            break;
          case collisionBodyType.rock:
            //@ts-ignore

            posx = weapon.pos.x += weapon.velocity.x;
            //@ts-ignore
            posy = weapon.pos.y += weapon.velocity.y;
            weapon.setPosition(posx, posy);

            break;
          case collisionBodyType.whip:
            //@ts-ignore

            posx = weapon.pos.x += weapon.velocity.x;
            //@ts-ignore
            posy = weapon.pos.y += weapon.velocity.y;
            weapon.setPosition(posx, posy);

            break;
        }
      });
    }

    const stateupdate = {
      type: "stateupdate",
      state: {
        players: room.players.map(player => {
          return {
            id: player.id,
            direction: player.direction,
            status: player.status,
            position: player.colliderBody.pos,
            color: player.color,
          };
        }),
        gamestates: room.gameState,
        cages: room.cages.map(cage => {
          return {
            id: cage.id,
            position: cage.position,
            angleVelocity: cage.angleVelocity,
          };
        }),
        exit: room.exit,
        enemies: room.enemies.map(en => {
          return {
            //@ts-ignore
            sid: en.sid,
            position: en.pos,
            //@ts-ignore
            direction: en.direction,
            //@ts-ignore
            state: en.state,
          };
        }),
        generators: room.generators.map(gen => {
          return {
            position: gen.pos,
            //@ts-ignore
            sid: gen.sid,
          };
        }),
        key: room.key,
        map: room.map,
        weapons: room.weapons.map(weapon => {
          return {
            //@ts-ignore
            sid: weapon.sid,
            type: weapon.cBody,
            position: weapon.pos,
          };
        }),
      },
    };

    server.broadcastMessage(key, encoder.encode(JSON.stringify(stateupdate)));
  });
}, 100);

async function handleMapRequest(room: string, user: string) {
  /* if (currentMap.length == 0) {
    let rslt;
    do {
      rslt = await generateNewMap();
    } while (rslt == undefined);
  } */

  server.sendMessage(
    room,
    user,
    encoder.encode(
      JSON.stringify({
        type: "map",
        msg: JSON.stringify(rooms.get(room)?.map),
      })
    )
  );
}

async function generateNewMap() {
  let lm = new LevelMaker(64, 64, 16);
  const map = lm.generateNewMap();
  const coords = findPattern(map, startingpattern);
  if (coords == null) return undefined;

  //find exit spot
  const rslt = findExit(lm.maze, coords[0], coords[1]);
  let exit, key, w1, w2, w3, w4, g1, g2;
  if (rslt) {
    exit = [rslt[0], rslt[1]];
    key = [rslt[2], rslt[3]];
    w1 = [rslt[4], rslt[5]];
    w2 = [rslt[6], rslt[7]];
    w3 = [rslt[8], rslt[9]];
    w4 = [rslt[10], rslt[11]];
    g1 = [rslt[12], rslt[13]];
    g2 = [rslt[14], rslt[15]];
  } else return null;

  return {
    map,
    coords,
    exit,
    key,
    w1,
    w2,
    w3,
    w4,
    g1,
    g2,
  };
}

function findPattern(matrix: number[][], pattern: number[][]): [number, number] | null {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const patternRows = pattern.length;
  const patternCols = pattern[0].length;

  function isPatternMatch(row: number, col: number): boolean {
    for (let r = 0; r < patternRows; r++) {
      for (let c = 0; c < patternCols; c++) {
        if (matrix[row + r][col + c] !== pattern[r][c]) {
          return false;
        }
      }
    }
    return true;
  }

  for (let row = 0; row <= rows - patternRows; row++) {
    for (let col = 0; col <= cols - patternCols; col++) {
      if (isPatternMatch(row, col)) {
        return [row, col];
      }
    }
  }

  return null;
}

type Coordinate = [number, number];

function findEdgeCoordinates(matrix: number[][]): Coordinate[] {
  const rows = matrix.length;
  const cols = matrix[0].length;

  const edgeCoordinates: Coordinate[] = [];

  const isOutOfBounds = (row: number, col: number): boolean => {
    return row < 0 || col < 0 || row >= rows || col >= cols;
  };

  const isEdgeCoordinate = (row: number, col: number): boolean => {
    if (matrix[row][col] === 255) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if ((dx !== 0 || dy !== 0) && !isOutOfBounds(row + dx, col + dy) && matrix[row + dx][col + dy] === 0) {
            return true;
          }
        }
      }
    }
    return false;
  };

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (isEdgeCoordinate(row, col)) {
        edgeCoordinates.push([row, col]);
      }
    }
  }

  return edgeCoordinates;
}

function addTilesToCollisionSystem(tiles: Coordinate[], dc: System): void {
  tiles.forEach(tile => {
    dc.insert(createWallBody(new Vector(tile[0] * 16, tile[1] * 16)));
  });
}

function createWallBody(position: Vector): colliderBody {
  return Object.assign(new Box({ x: position.x, y: position.y }, 16, 16, { isStatic: true }), {
    cBody: collisionBodyType.wall,
  });
}

function createPlayerBody(position: Vector): colliderBody {
  return Object.assign(new Box({ x: position.x, y: position.y }, 15, 15, { isCentered: true }), {
    cBody: collisionBodyType.player,
    sid: uuidv4(),
  });
}

function createCageBody(position: Vector): colliderBody {
  return Object.assign(new Box({ x: position.x, y: position.y }, 14, 14, { isCentered: true }), {
    cBody: collisionBodyType.cage,
  });
}

function createExitBody(position: Vector): colliderBody {
  return Object.assign(new Box({ x: position.x, y: position.y }, 14, 14, { isStatic: true }), {
    cBody: collisionBodyType.exit,
  });
}

function createKeyBody(position: Vector): colliderBody {
  return Object.assign(new Box({ x: position.x, y: position.y }, 14, 14, { isStatic: true }), {
    cBody: collisionBodyType.key,
  });
}

function createClubBody(position: Vector, velocity: Vector, engaged: boolean): colliderBody {
  let status;
  if (engaged) status = "engaged";
  else status = "onground";

  return Object.assign(new Box({ x: position.x, y: position.y }, 14, 14, { isTrigger: true }), {
    cBody: collisionBodyType.club,
    status: status,
    velocity: velocity,
    sid: uuidv4(),
  });
}

function createKniveBody(position: Vector, velocity: Vector, engaged: boolean): colliderBody {
  let status;
  if (engaged) status = "engaged";
  else status = "onground";

  return Object.assign(new Box({ x: position.x, y: position.y }, 14, 14, { isTrigger: true }), {
    cBody: collisionBodyType.knife,
    status: status,
    velocity: velocity,
    sid: uuidv4(),
  });
}

function createRockBody(position: Vector, velocity: Vector, engaged: boolean): colliderBody {
  let status;
  if (engaged) status = "engaged";
  else status = "onground";

  return Object.assign(new Box({ x: position.x, y: position.y }, 14, 14, { isTrigger: true }), {
    cBody: collisionBodyType.rock,
    status: status,
    velocity: velocity,
    sid: uuidv4(),
  });
}

function createWhipBody(position: Vector, velocity: Vector, engaged: boolean): colliderBody {
  let status;
  if (engaged) status = "engaged";
  else status = "onground";

  return Object.assign(new Box({ x: position.x, y: position.y }, 14, 14, { isTrigger: true }), {
    cBody: collisionBodyType.whip,
    status: status,
    velocity: velocity,
    sid: uuidv4(),
  });
}

function createEnemyGeneratorBody(position: Vector, coords: [number, number]): colliderBody {
  return Object.assign(new Box({ x: position.x, y: position.y }, 14, 14, { isCentered: true }), {
    cBody: collisionBodyType.generator,
    sid: uuidv4(),
    coords: coords,
  });
}

function createEnemyBody(position: Vector, coords: [number, number]): colliderBody {
  return Object.assign(new Box({ x: position.x, y: position.y }, 15, 15, { isCentered: true }), {
    cBody: collisionBodyType.enemy,
    sid: uuidv4(),
    velocity: new Vector(0, 0),
    state: enemyState.idle,
    direction: "down",
    AItik: 0,
    AIlimit: 0,
    target: null,
    destinationVector: new Vector(0, 0),
    patrolCoords: [0, 0],
    currentCoords: [0, 0],
    remainingAmountToMove: 0,
    patrolPath: [],
    patrolIndex: 0,
    patrolState: "idle",
  });
}

function startBreakOut(game: InternalState, roomID: RoomId) {
  //for each cage entity
  let cageIntervals: NodeJS.Timer[] = [];

  //cage vibration
  game.cages.forEach((cage, index) => {
    cageIntervals[index] = setInterval(() => {
      let dx = Math.random() * 2 - 1;
      let dy = Math.random() * 2 - 1;
      cage.position = cage.position.add(new Vector(dx, dy));
    }, 100);
  });

  //end vibration and set velocity and delay removal of entity
  setTimeout(() => {
    //clear intervals
    cageIntervals.forEach(int => clearInterval(int));
    //all cages shoot off away from players and dissappear
    game.cages[0].velocity = new Vector(8 * Math.cos(deg2rad(-120)), 8 * Math.sin(deg2rad(-120)));
    game.cages[0].angleVelocity = 3;
    game.cages[1].velocity = new Vector(8 * Math.cos(deg2rad(-90)), 8 * Math.sin(deg2rad(-90)));
    game.cages[1].angleVelocity = 3;
    game.cages[2].velocity = new Vector(8 * Math.cos(deg2rad(-90)), 8 * Math.sin(deg2rad(-90)));
    game.cages[2].angleVelocity = 3;
    game.cages[3].velocity = new Vector(8 * Math.cos(deg2rad(-45)), 8 * Math.sin(deg2rad(-45)));
    game.cages[3].angleVelocity = 3;
    game.cages[4].velocity = new Vector(8 * Math.cos(deg2rad(180)), 8 * Math.sin(deg2rad(180)));
    game.cages[4].angleVelocity = 3;
    game.cages[5].velocity = new Vector(8 * Math.cos(deg2rad(0)), 8 * Math.sin(deg2rad(0)));
    game.cages[5].angleVelocity = 3;
    game.cages[6].velocity = new Vector(8 * Math.cos(deg2rad(180)), 8 * Math.sin(deg2rad(180)));
    game.cages[6].angleVelocity = 3;
    game.cages[7].velocity = new Vector(8 * Math.cos(deg2rad(0)), 8 * Math.sin(deg2rad(0)));
    game.cages[7].angleVelocity = 3;
    game.cages[8].velocity = new Vector(8 * Math.cos(deg2rad(120)), 8 * Math.sin(deg2rad(120)));
    game.cages[8].angleVelocity = 3;
    game.cages[9].velocity = new Vector(8 * Math.cos(deg2rad(90)), 8 * Math.sin(deg2rad(90)));
    game.cages[9].angleVelocity = 3;
    game.cages[10].velocity = new Vector(8 * Math.cos(deg2rad(90)), 8 * Math.sin(deg2rad(90)));
    game.cages[10].angleVelocity = 3;
    game.cages[11].velocity = new Vector(8 * Math.cos(deg2rad(45)), 8 * Math.sin(deg2rad(45)));
    game.cages[11].angleVelocity = 3;
    setTimeout(() => {
      game.cages.forEach(cage => {
        game.dc.remove(cage.body);
      });

      server.broadcastMessage(
        roomID,
        encoder.encode(
          JSON.stringify({
            type: "UIevent",
            msg: "removeCages",
          })
        )
      );
    }, 1500);
  }, 2000);
}

function findExit(
  tiles: number[][],
  startX: number,
  startY: number
):
  | [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number]
  | null {
  const maxX = tiles.length;
  const maxY = tiles[0].length;
  const visited: boolean[][] = Array.from({ length: maxX }, () => Array(maxY).fill(false));

  if (!isWithinBounds(startX, startY, maxX, maxY)) {
    throw new Error("Invalid starting point");
  }

  if (tiles[startX][startY] == 255) {
    throw new Error("Starting point is a wall");
  }

  const availableExitTiles: number[][] = [];
  for (let x = 0; x < maxX; x++) {
    for (let y = 0; y < maxY; y++) {
      if (tiles[x][y] != 255 && (x !== startX || y !== startY)) {
        availableExitTiles.push([x, y]);
      }
    }
  }

  if (availableExitTiles.length === 0) {
    throw new Error("No available exit tiles");
  }

  let exitX: number;
  let exitY: number;
  let keyX: number;
  let keyY: number;
  let weapon1x: number;
  let weapon1y: number;
  let weapon2x: number;
  let weapon2y: number;
  let weapon3x: number;
  let weapon3y: number;
  let weapon4x: number;
  let weapon4y: number;
  let g1x, g2x, g1y, g2y;
  let g1, g2;
  do {
    const randomExitTile = availableExitTiles[Math.floor(Math.random() * availableExitTiles.length)];
    const randomKeyTile = availableExitTiles[Math.floor(Math.random() * availableExitTiles.length)];
    const w1Tile = availableExitTiles[Math.floor(Math.random() * availableExitTiles.length)];
    const w2Tile = availableExitTiles[Math.floor(Math.random() * availableExitTiles.length)];
    const w3Tile = availableExitTiles[Math.floor(Math.random() * availableExitTiles.length)];
    const w4Tile = availableExitTiles[Math.floor(Math.random() * availableExitTiles.length)];
    let distance1, distance2;
    do {
      g1 = availableExitTiles[Math.floor(Math.random() * availableExitTiles.length)];
      distance1 = Math.sqrt(
        (randomExitTile[0] - g1[0]) * (randomExitTile[0] - g1[0]) + (randomExitTile[1] - g1[1]) * (randomExitTile[1] - g1[1])
      );
      //console.log("distance1  ", distance1);
    } while (distance1 > 7);
    do {
      g2 = availableExitTiles[Math.floor(Math.random() * availableExitTiles.length)];
      distance2 = Math.sqrt(
        (randomKeyTile[0] - g2[0]) * (randomExitTile[0] - g2[0]) + (randomKeyTile[1] - g2[1]) * (randomKeyTile[1] - g2[1])
      );
      //console.log("distance2  ", distance1);
    } while (distance2 > 7);

    exitX = randomExitTile[0];
    exitY = randomExitTile[1];
    keyX = randomKeyTile[0];
    keyY = randomKeyTile[1];
    weapon1x = w1Tile[0];
    weapon1y = w1Tile[1];
    weapon2x = w2Tile[0];
    weapon2y = w2Tile[1];
    weapon3x = w3Tile[0];
    weapon3y = w3Tile[1];
    weapon4x = w4Tile[0];
    weapon4y = w4Tile[1];
    g1x = g1[0];
    g1y = g1[1];
    g2x = g2[0];
    g2y = g2[1];
  } while (
    !isReachable(tiles, startX, startY, exitX, exitY, visited) &&
    !isReachable(tiles, startX, startY, keyX, keyY, visited) &&
    !isReachable(tiles, startX, startY, weapon1x, weapon1y, visited) &&
    !isReachable(tiles, startX, startY, weapon2x, weapon2y, visited) &&
    !isReachable(tiles, startX, startY, weapon3x, weapon3y, visited) &&
    !isReachable(tiles, startX, startY, weapon4x, weapon4y, visited)
  );

  /*console.log(
    exitX,
    exitY,
    keyX,
    keyY,
    weapon1x,
    weapon1y,
    weapon2x,
    weapon2y,
    weapon3x,
    weapon3y,
    weapon4x,
    weapon4y,
    g1x,
    g1y,
    g2x,
    g2y
  );*/

  return [
    exitX,
    exitY,
    keyX,
    keyY,
    weapon1x,
    weapon1y,
    weapon2x,
    weapon2y,
    weapon3x,
    weapon3y,
    weapon4x,
    weapon4y,
    g1x,
    g1y,
    g2x,
    g2y,
  ];
}

function isWithinBounds(x: number, y: number, maxX: number, maxY: number): boolean {
  return x >= 0 && y >= 0 && x < maxX && y < maxY;
}

function isReachable(
  tiles: number[][],
  currentX: number,
  currentY: number,
  exitX: number,
  exitY: number,
  visited: boolean[][]
): boolean {
  const maxX = tiles.length;
  const maxY = tiles[0].length;

  if (!isWithinBounds(currentX, currentY, maxX, maxY) || visited[currentX][currentY] || tiles[currentX][currentY] == 255) {
    return false;
  }

  visited[currentX][currentY] = true;

  if (currentX === exitX && currentY === exitY) {
    return true;
  }

  const neighbors = [
    [currentX - 1, currentY],
    [currentX + 1, currentY],
    [currentX, currentY - 1],
    [currentX, currentY + 1],
  ];

  for (const [nextX, nextY] of neighbors) {
    if (isReachable(tiles, nextX, nextY, exitX, exitY, visited)) {
      return true;
    }
  }

  return false;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateRandomVectors(startingVector: Vector): Array<Vector> {
  const tileVectors: Vector[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) {
        continue; // Skip the center tile (entity's position)
      }
      const raycastVector = new Vector(dx, dy).multiply(10);

      //const tileVector = startingVector.add(raycastVector);
      //console.log("tile", tileVector);

      tileVectors.push(raycastVector);
    }
  }
  return shuffleArray(tileVectors);
}

function isCoordinateValid(matrix: Array<Array<number>>, x: number, y: number): boolean {
  const numRows = matrix.length;
  const numCols = matrix[0].length;
  return x >= 0 && x < numRows && y >= 0 && y < numCols;
}

function isTileEmpty(matrix: Array<Array<number>>, x: number, y: number): boolean {
  return matrix[x][y] === 0;
}

function isPatrolTileReachable(
  matrix: Array<Array<number>>,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number
): boolean {
  const queue: [number, number][] = [[startX, startY]];
  const visited: boolean[][] = [];

  for (let i = 0; i < matrix.length; i++) {
    visited[i] = new Array(matrix[i].length).fill(false);
  }

  visited[startX][startY] = true;

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;

    if (x === targetX && y === targetY) {
      return true;
    }

    const neighbors: [number, number][] = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (isCoordinateValid(matrix, nx, ny) && isTileEmpty(matrix, nx, ny) && !visited[nx][ny]) {
        queue.push([nx, ny]);
        visited[nx][ny] = true;
      }
    }
  }

  return false;
}

interface Point {
  x: number;
  y: number;
}

class EnemyPatrol {
  grid: number[][];
  start: Point;
  target: Point;

  constructor(grid: number[][], start: Point, target: Point) {
    this.grid = grid;
    this.start = start;
    this.target = target;
  }

  findPatrolPath(): Point[] | null {
    const queue: Point[] = [this.start];
    const visited: boolean[][] = Array.from({ length: this.grid.length }, () => Array(this.grid[0].length).fill(false));
    const parents: Map<string, Point> = new Map();

    const dx = [1, -1, 0, 0]; // Possible horizontal movements
    const dy = [0, 0, 1, -1]; // Possible vertical movements

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.x === this.target.x && current.y === this.target.y) {
        // Build the path by traversing back through the parents
        const path: Point[] = [];
        let node: Point | undefined = current;
        while (node) {
          path.unshift(node);
          node = parents.get(`${node.x},${node.y}`);
        }
        return path;
      }

      for (let i = 0; i < 4; i++) {
        const newX = current.x + dx[i];
        const newY = current.y + dy[i];

        if (
          newX >= 0 &&
          newX < this.grid.length &&
          newY >= 0 &&
          newY < this.grid[0].length &&
          this.grid[newX][newY] === 0 &&
          !visited[newX][newY]
        ) {
          queue.push({ x: newX, y: newY });
          visited[newX][newY] = true;
          parents.set(`${newX},${newY}`, current);
        }
      }
    }

    return null; // No path found
  }
}

// Example usage
/* const grid = [
  [0, 0, 1, 0, 0],
  [0, 1, 0, 0, 1],
  [0, 0, 0, 1, 0],
  [1, 0, 0, 0, 0],
  [0, 1, 0, 0, 0],
];

const start = { x: 0, y: 0 };
const target = { x: 4, y: 4 };

const enemyPatrol = new EnemyPatrol(grid, start, target);
const patrolPath = enemyPatrol.findPatrolPath();

if (patrolPath) {
  console.log("Patrol Path:", patrolPath);
} else {
  console.log("No path found.");
} */
