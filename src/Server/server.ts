import { Application, RoomId, startServer, UserId, verifyJwt } from "@hathora/server-sdk";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { LevelMaker } from "../serversideLevelMaker.ts";
import { Vector } from "../../_SqueletoECS/Vector.ts";
import { gamestates } from "../projecttypes.ts";
import { System, Box, RaycastHit } from "detect-collisions";

dotenv.config();

enum collisionBodyType {
  player,
  wall,
  cage,
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
  map: Array<Array<number>> | undefined;
  startingCoords: [number, number];
  players: InternalPlayer[];
  capacity: number;
  gameState: gamestates;
  cages: Vector[];
};

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
};

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");
const rooms: Map<RoomId, InternalState> = new Map();

const app: Application = {
  verifyToken: (token: string, roomId: string): Promise<UserId | undefined> => {
    return new Promise((resolve, reject) => {
      const result = verifyJwt(token, process.env.HATHORA_APP_SECRET as string);
      console.log("token verificaiton: ", token, roomId);
      console.log(result);

      if (result) resolve(result);
      else reject();
    });
  },
  subscribeUser: (roomId: RoomId, userId: UserId): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      /*************************************************
       * If room doesn't exist, create it and add to map
       ************************************************/
      if (!rooms.has(roomId)) {
        console.log("creating room");
        let mapdata: { map: any[]; coords: [number, number] } | undefined;
        do {
          mapdata = await generateNewMap();
        } while (!mapdata);
        console.log("starting coords", mapdata.coords);
        //findEdgeCoordinates and add to collision system
        const bankOfCoords = findEdgeCoordinates(mapdata.map);
        addTilesToCollisionSystem(bankOfCoords);

        let cages: Vector[] = [];
        cages.push(new Vector(mapdata.coords[0] * 16, mapdata.coords[1] * 16));
        dc.insert(createCageBody(new Vector(mapdata.coords[0] * 16, mapdata.coords[1] * 16)));
        cages.push(new Vector((mapdata.coords[0] + 1) * 16, mapdata.coords[1] * 16));
        dc.insert(createCageBody(new Vector((mapdata.coords[0] + 1) * 16, mapdata.coords[1] * 16)));
        cages.push(new Vector((mapdata.coords[0] + 2) * 16, mapdata.coords[1] * 16));
        dc.insert(createCageBody(new Vector((mapdata.coords[0] + 2) * 16, mapdata.coords[1] * 16)));
        cages.push(new Vector((mapdata.coords[0] + 3) * 16, mapdata.coords[1] * 16));
        dc.insert(createCageBody(new Vector((mapdata.coords[0] + 3) * 16, mapdata.coords[1] * 16)));
        cages.push(new Vector(mapdata.coords[0] * 16, (mapdata.coords[1] + 1) * 16));
        dc.insert(createCageBody(new Vector(mapdata.coords[0] * 16, (mapdata.coords[1] + 1) * 16)));
        cages.push(new Vector((mapdata.coords[0] + 3) * 16, (mapdata.coords[1] + 1) * 16));
        dc.insert(createCageBody(new Vector((mapdata.coords[0] + 3) * 16, (mapdata.coords[1] + 1) * 16)));
        cages.push(new Vector(mapdata.coords[0] * 16, (mapdata.coords[1] + 2) * 16));
        dc.insert(createCageBody(new Vector(mapdata.coords[0] * 16, (mapdata.coords[1] + 2) * 16)));
        cages.push(new Vector((mapdata.coords[0] + 3) * 16, (mapdata.coords[1] + 2) * 16));
        dc.insert(createCageBody(new Vector((mapdata.coords[0] + 3) * 16, (mapdata.coords[1] + 2) * 16)));
        cages.push(new Vector(mapdata.coords[0] * 16, (mapdata.coords[1] + 3) * 16));
        dc.insert(createCageBody(new Vector(mapdata.coords[0] * 16, (mapdata.coords[1] + 3) * 16)));
        cages.push(new Vector((mapdata.coords[0] + 1) * 16, (mapdata.coords[1] + 3) * 16));
        dc.insert(createCageBody(new Vector((mapdata.coords[0] + 1) * 16, (mapdata.coords[1] + 3) * 16)));
        cages.push(new Vector((mapdata.coords[0] + 2) * 16, (mapdata.coords[1] + 3) * 16));
        dc.insert(createCageBody(new Vector((mapdata.coords[0] + 2) * 16, (mapdata.coords[1] + 3) * 16)));
        cages.push(new Vector((mapdata.coords[0] + 3) * 16, (mapdata.coords[1] + 3) * 16));
        dc.insert(createCageBody(new Vector((mapdata.coords[0] + 3) * 16, (mapdata.coords[1] + 3) * 16)));

        let newRoomState: InternalState = {
          players: [],
          capacity: 4,
          map: mapdata?.map,
          startingCoords: mapdata.coords,
          gameState: gamestates.prestart,
          cages: [...cages],
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
        direction: "down",
        velocity: new Vector(0, 0),
        status: "idle",
        color: myColor,
        colliderBody: cbody,
      };
      dc.insert(cbody);
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
      //console.log(`message from ${userId}, in ${roomId}: `, msg);

      switch (msg.type) {
        case "sendMap":
          await handleMapRequest(roomId, userId);
          break;
        case "DirectionUpdate":
          console.log("direction update from : ", userId, " in room ", roomId, "and pressed ", msg);
          //confirm room
          const game = rooms.get(roomId);
          if (game == undefined) return;

          const playerIndex = game.players.findIndex((player: any) => player.id == userId);
          if ((playerIndex as number) >= 0 && game) {
            console.log("direction change: ", msg.msg);

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
let dc = new System();

setInterval(() => {
  rooms.forEach((room, key) => {
    //***************** */
    //Collision Check/mgmt
    //***************** */

    dc.checkAll(response => {
      let { a, b, overlapV } = response;
      if ((a as colliderBody).cBody == collisionBodyType.player && (b as colliderBody).cBody == collisionBodyType.wall) {
        //player and wall
        a.x -= overlapV.x;
        a.y -= overlapV.y;

        /* const plrIndex = room.players.findIndex(plr => plr.colliderBody == a);
        room.players[plrIndex].position.x = a.x;
        room.players[plrIndex].position.y = a.y; */
      } else if ((a as colliderBody).cBody == collisionBodyType.player && (b as colliderBody).cBody == collisionBodyType.player) {
        //player and player
        b.x += overlapV.x;
        b.y += overlapV.y;
        /* const plrIndex = room.players.findIndex(plr => plr.colliderBody == b);
        room.players[plrIndex].position.x = b.x;
        room.players[plrIndex].position.y = b.y; */
      } else if ((a as colliderBody).cBody == collisionBodyType.player && (b as colliderBody).cBody == collisionBodyType.cage) {
        //player and cage
        a.x -= overlapV.x;
        a.y -= overlapV.y;
        /* const plrIndex = room.players.findIndex(plr => plr.colliderBody == a);
        room.players[plrIndex].position.x = a.x;
        room.players[plrIndex].position.y = a.y; */
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
          cages: room.cages,
          map: room.map,
        },
      };

      server.broadcastMessage(key, encoder.encode(JSON.stringify(stateupdate)));
    }
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

  return {
    map,
    coords,
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
    //console.log("edge check: ", row, col, matrix[row][col]);

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

function addTilesToCollisionSystem(tiles: Coordinate[]): void {
  tiles.forEach(tile => {
    dc.insert(createWallBody(new Vector(tile[0] * 16, tile[1] * 16)));
  });
}

function createWallBody(position: Vector): colliderBody {
  return Object.assign(new Box({ x: position.x, y: position.y }, 16, 16, { isStatic: true, isCentered: true }), {
    cBody: collisionBodyType.wall,
  });
}

function createPlayerBody(position: Vector): colliderBody {
  return Object.assign(new Box({ x: position.x, y: position.y }, 16, 16, { isCentered: true }), {
    cBody: collisionBodyType.player,
  });
}

function createCageBody(position: Vector): colliderBody {
  return Object.assign(new Box({ x: position.x, y: position.y }, 16, 16, { isStatic: true, isCentered: true }), {
    cBody: collisionBodyType.cage,
  });
}
