import { Application, RoomId, startServer, UserId, verifyJwt } from "@hathora/server-sdk";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { LevelMaker } from "../serversideLevelMaker.ts";
import { Vector } from "../../_SqueletoECS/Vector.ts";
import { gamestates } from "../projecttypes.ts";
import { System, Box, RaycastHit, deg2rad } from "detect-collisions";
//@ts-ignore
import { v4 as uuidv4 } from "uuid";

dotenv.config();

enum collisionBodyType {
  player = "player",
  wall = "wall",
  cage = "cage",
  exit = "exit",
  key = "key",
  club = "club",
  knife = "knife",
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
  key: {
    location: Vector;
    status: "available" | "taken";
  };
};

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
        let mapdata: { map: any[]; coords: [number, number]; exit: number[] | null; key: number[] | null } | undefined | null;
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

        //Creating Exit entity
        let myKey;
        if (mapdata.key) myKey = createKeyBody(new Vector(mapdata.key[0] * 16, mapdata.key[1] * 16));
        tempDC.insert(myKey as colliderBody);

        let newRoomState: InternalState = {
          dc: tempDC,
          players: [],
          weapons: [],
          capacity: 4,
          map: mapdata?.map,
          startingCoords: mapdata.coords,
          gameState: gamestates.prestart,
          cages: [...cages],
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
          weapon: weaponType.knife,
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
      console.log("sending debug data");
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
        case "weaponEngage":
          console.log(`${userId} from room ${roomId} firing weapon`);

          game = rooms.get(roomId);
          if (game == undefined) return;
          playerIndex = game.players.findIndex((player: any) => player.id == userId);
          if (game.players[playerIndex].inventory.weapon == weaponType.none) return;

          let currentWeapon;
          let myPosition;
          let knifeVelocity;
          switch (game.players[playerIndex].direction) {
            case "left":
              myPosition = game.players[playerIndex].colliderBody.pos.add(new Vector(-24, -8));
              knifeVelocity = new Vector(-10, 0);
              break;
            case "right":
              myPosition = game.players[playerIndex].colliderBody.pos.add(new Vector(8, -8));
              knifeVelocity = new Vector(10, 0);
              break;
            case "down":
              myPosition = game.players[playerIndex].colliderBody.pos.add(new Vector(-8, 8));
              knifeVelocity = new Vector(0, 10);
              break;
            case "up":
              myPosition = game.players[playerIndex].colliderBody.pos.add(new Vector(-8, -24));
              knifeVelocity = new Vector(0, -10);
              break;
            default:
              knifeVelocity = new Vector(0, 0);
          }
          console.log(game.players[playerIndex].inventory.weapon);

          switch (game.players[playerIndex].inventory.weapon) {
            case weaponType.club:
              currentWeapon = createClubBody(myPosition);
              break;
            case weaponType.knife:
              console.log("creating knive body");

              currentWeapon = createKniveBody(myPosition, knifeVelocity);
              break;
          }
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

        /* const plrIndex = room.players.findIndex(plr => plr.colliderBody == a);
      room.players[plrIndex].position.x = a.x;
      room.players[plrIndex].position.y = a.y; */
      } else if ((a as colliderBody).cBody == collisionBodyType.player && (b as colliderBody).cBody == collisionBodyType.key) {
        console.log("key collision");
        console.log(room.key.status);

        if (room.key.status == "available") {
          room.key.status = "taken";
          console.log("sending key message");

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
      room.weapons.forEach(weapon => {
        switch (weapon.cBody) {
          case collisionBodyType.club:
            break;
          case collisionBodyType.knife:
            //@ts-ignore
            let posx = (weapon.pos.x += weapon.velocity.x);
            //@ts-ignore
            let posy = (weapon.pos.y += weapon.velocity.y);
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
  let exit, key;
  if (rslt) {
    exit = [rslt[0], rslt[1]];
    key = [rslt[2], rslt[3]];
  } else return null;

  return {
    map,
    coords,
    exit,
    key,
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

function createClubBody(position: Vector): colliderBody {
  return Object.assign(new Box({ x: position.x, y: position.y }, 14, 14, { isTrigger: true }), {
    cBody: collisionBodyType.club,
    sid: uuidv4(),
  });
}

function createKniveBody(position: Vector, velocity: Vector): colliderBody {
  return Object.assign(new Box({ x: position.x, y: position.y }, 14, 14, { isTrigger: true }), {
    cBody: collisionBodyType.knife,
    velocity: velocity,
    sid: uuidv4(),
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

function findExit(tiles: number[][], startX: number, startY: number): [number, number, number, number] | null {
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
  do {
    const randomExitTile = availableExitTiles[Math.floor(Math.random() * availableExitTiles.length)];
    const randomKeyTile = availableExitTiles[Math.floor(Math.random() * availableExitTiles.length)];
    exitX = randomExitTile[0];
    exitY = randomExitTile[1];
    keyX = randomKeyTile[0];
    keyY = randomKeyTile[1];
  } while (isReachable(tiles, startX, startY, exitX, exitY, visited));

  console.log(exitX, exitY, keyX, keyY);

  return [exitX, exitY, keyX, keyY];
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
