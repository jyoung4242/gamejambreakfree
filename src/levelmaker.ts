import { makeMaze, addMapRooms } from "./mazemaker.js";
//@ts-ignore
import { Chance } from "chance";

const chance = new Chance();
const RANDOM_OBJECT_FACTOR = 1.25;

/**
 * How to use LevelMaker
 * Step 1 - instantiate class -> const lm = new LevelMaker(width, height, tilesize)
 * Step 2 - generate new map  -> lm.generateNewMap()
 * Step 3 - load tileset -> await lm.loadTileset(string path to image)
 * Step 4 - load tile assignment array -> lm.loadTileDefinition([{name: 'mytile', tiles: [{tilelocX: 16, tilelocY:32},...]},...])
 * Step 5 - load bitmask assignment array -> lm.loadBitmasks([[0x4d, 'dirt'], [0x10], 'grass'],....)
 * Step 6 - set your 'zero' or non-wall tiles -> lm.setZeroTiles(['dirt1', 'dirt2', ...])
 * Step 7 - *optional* fill base layer tiles -> lm.fillMap('dirt1')
 * Step 8 - *optional* set your random objects tiles -> lm.loadRandomObjectTiles(['flower1', 'rock', 'bush'...])
 * Step 9 - set your base layer of tiles (0s and 1s) -> lm.setBaseTiles()
 * step 10 - draw random objects -> lm.drawRandomTiles(0)
 * Step 11 - get your image -> await lm.getMapImage()
 */

export class LevelMaker {
  //mazemaker params
  border: number = 3;
  loop: boolean = false;
  symmetry: boolean = false;
  straightness: number = 0.2;
  imperfect: number = 0.2;
  fill: number = 0.2;
  deadEndArray: Array<any> = [];
  hallwidth: number = 0;
  wallwidth: number = 0;

  //maze params
  maze: Array<any> = [];
  numTilesInMaze: number = 0;

  //drawing elements
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | null;
  levelImage: HTMLImageElement;
  tilesetCanvas: HTMLCanvasElement;
  tilesetCtx: CanvasRenderingContext2D | null;
  tileset: HTMLImageElement;
  zeroTiles: Array<string> | undefined;
  randomTiles: Array<string> | undefined;

  //Records (tiles and bitmask assignments)
  tiles: Record<string, HTMLImageElement> = {};
  bitmasks: Record<number, string> = {};

  constructor(public width: number, public height: number, public tilesize: number) {
    this.levelImage = new Image(this.tilesize * this.width, this.tilesize * this.height);
    this.tileset = new Image();
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
    this.canvas.width = this.tilesize * this.width;
    this.canvas.height = this.tilesize * this.height;
    this.tilesetCanvas = document.createElement("canvas");
    this.tilesetCtx = this.tilesetCanvas.getContext("2d");
  }

  readMap(newMap: Array<any>) {
    this.maze = newMap;
    this.numTilesInMaze = this.maze.length * this.maze[0].length;
  }

  generateNewMap() {
    this.maze = makeMaze(
      this.width,
      this.height,
      { border: this.border, loop: this.loop, symmetry: this.symmetry },
      { border: this.border, loop: this.loop, symmetry: this.symmetry },
      this.straightness,
      this.imperfect,
      this.fill,
      this.deadEndArray,
      this.hallwidth,
      this.wallwidth
    );
    addMapRooms(
      this.maze,
      1,
      1,
      { border: this.border, loop: this.loop, symmetry: this.symmetry },
      { border: this.border, loop: this.loop, symmetry: this.symmetry },
      this.deadEndArray,
      1
    );
    this.numTilesInMaze = this.maze.length * this.maze[0].length;
    //console.log("generateMap: ", this.maze, this.numTilesInMaze);
    return this.maze;
  }

  setBaseTiles() {
    if (Object.keys(this.tiles).length == 0) return;
    if (Object.keys(this.bitmasks).length == 0) return;
    if (this.maze.length == 0) return;
    if (this.tileset.src == "") return;
    if (this.zeroTiles?.length == 0) return;

    for (let index = 0; index < this.numTilesInMaze; index++) {
      let x = index % this.width;
      let y = Math.floor(index / this.width);
      if (this.maze[x][y] == 0) {
        this.context?.drawImage(
          this.tiles[chance.pickone(this.zeroTiles as Array<string>)],
          0,
          0,
          this.tilesize,
          this.tilesize,
          x * this.tilesize,
          y * this.tilesize,
          this.tilesize,
          this.tilesize
        );
      } else {
        const edgeCheck: number = this.tileTest(index);
        this.context?.drawImage(
          this.tiles[this.bitmasks[edgeCheck]],
          0,
          0,
          this.tilesize,
          this.tilesize,
          x * this.tilesize,
          y * this.tilesize,
          this.tilesize,
          this.tilesize
        );
      }
    }
  }

  setZeroTiles(tilenames: Array<string>) {
    this.zeroTiles = [...tilenames];
    //console.log(this.zeroTiles);
  }

  async loadTileset(src: string): Promise<void> {
    return new Promise(resolve => {
      this.tileset.onload = () => {
        const tilesetwidth = this.tileset.width;
        const tilesetheight = this.tileset.height;
        this.tilesetCanvas.width = tilesetwidth;
        this.tilesetCanvas.height = tilesetheight;
        /* console.log(tilesetwidth, tilesetheight);
        console.log(this.tileset); */

        this.tilesetCtx?.drawImage(this.tileset, 0, 0, tilesetwidth, tilesetheight);
        resolve();
      };
      this.tileset.src = src;
    });
  }

  async loadTileDefinition(assignments: Array<{ name: string; tiles: Array<{ tilelocX: number; tilelocY: number }> }>) {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = this.tilesize;
    tempCanvas.height = this.tilesize;

    const imagePromises: Promise<HTMLImageElement>[] = [];

    if (tempCtx == null || this.tilesetCtx == null) return;

    assignments.forEach(tileAssignment => {
      tempCtx.clearRect(0, 0, this.tilesize, this.tilesize);
      tileAssignment.tiles.forEach(tile => {
        tempCtx.drawImage(
          this.tileset,
          tile.tilelocX,
          tile.tilelocY,
          this.tilesize,
          this.tilesize,
          0,
          0,
          this.tilesize,
          this.tilesize
        );
      });
      const thisPromise = new Promise<HTMLImageElement>(resolve => {
        this.tiles[tileAssignment.name] = new Image(this.tilesize, this.tilesize);
        this.tiles[tileAssignment.name].onload = () => {
          resolve(this.tiles[tileAssignment.name]);
        };
      });
      this.tiles[tileAssignment.name].src = tempCanvas.toDataURL();
      imagePromises.push(thisPromise);
    });
    await Promise.all(imagePromises);
    //console.log(this.tiles);
  }

  async loadBitmasks(bitmasks: Array<Array<number | string>>) {
    return new Promise<void>(resolve => {
      bitmasks.forEach(bitmask => {
        this.bitmasks[bitmask[0] as number] = bitmask[1] as string;
      });
      resolve();
    });
  }

  fillMap(tilename: string) {
    for (let index = 0; index < this.numTilesInMaze; index++) {
      let x = index % this.width;
      let y = Math.floor(index / this.width);
      if (this.context == null) return;
      this.context.drawImage(
        this.tiles[tilename],
        0,
        0,
        this.tilesize,
        this.tilesize,
        x * this.tilesize,
        y * this.tilesize,
        this.tilesize,
        this.tilesize
      );
    }
  }

  assignBitmask(testArray: Array<boolean>): number {
    let bitmask = 0;
    //check corners first
    if (!(testArray[1] && testArray[3])) testArray[0] = false; //tl
    if (!(testArray[4] && testArray[1])) testArray[2] = false; //tr
    if (!(testArray[3] && testArray[6])) testArray[5] = false; //bl
    if (!(testArray[4] && testArray[6])) testArray[7] = false; //bl

    if (testArray[0] == true) bitmask += 1;
    if (testArray[1] == true) bitmask += 2;
    if (testArray[2] == true) bitmask += 4;
    if (testArray[3] == true) bitmask += 8;
    if (testArray[4] == true) bitmask += 16;
    if (testArray[5] == true) bitmask += 32;
    if (testArray[6] == true) bitmask += 64;
    if (testArray[7] == true) bitmask += 128;
    return bitmask;
  }

  tileTest(index: number): number {
    const neighborIndices = [
      index - this.width - 1,
      index - this.width,
      index - this.width + 1,
      index - 1,
      index + 1,
      index + this.width - 1,
      index + this.width,
      index + this.width + 1,
    ];
    // Check if the index is on any of the four edges of the grid
    const resultArray = [];
    for (let i = 0; i < 8; i++) {
      const y = Math.floor(neighborIndices[i] / this.width);
      const x = neighborIndices[i] % this.width;

      if (this.isIndexValid(neighborIndices[i]) && this.maze[x][y] === 0) {
        resultArray.push(false);
      } else resultArray.push(true);
    }
    return this.assignBitmask(resultArray);
  }

  isIndexValid(index: number): boolean {
    // Check if the index is out of bounds of the grid
    if (index < 0 || index >= this.numTilesInMaze) {
      return false;
    }

    // Check if the index is on any of the four edges of the grid
    const row = Math.floor(index / this.width);
    const col = index % this.width;
    return row >= 0 && row < this.height - 1 && col >= 0 && col < this.width - 1;
  }

  drawRandomTiles(tiletype: 0 | 1) {
    let count = 0;
    let tileMap = new Map();

    this.maze.forEach((row: any[], x: number) => {
      row.forEach((col: any, y: number) => {
        if (col == tiletype) {
          tileMap.set(count, [x, y]);
          count++;
        }
      });
    });

    let percentTile = Math.floor((count / this.numTilesInMaze) * 100);
    const randomObjectsArray = this.getRandomEntriesFromMap(percentTile * RANDOM_OBJECT_FACTOR, tileMap);
    this.drawObjectFromArray(randomObjectsArray);
    return randomObjectsArray;
  }

  getRandomEntriesFromMap(quantity: number, map: Map<any, any>): Array<any> {
    const entriesArray = Array.from(map.values());
    const resultArray: Array<any> = [];

    if (quantity >= entriesArray.length) {
      return entriesArray;
    }

    const selectedIndices = new Set<number>();

    while (selectedIndices.size < quantity) {
      const randomIndex = chance.integer({ min: 0, max: entriesArray.length });
      if (!selectedIndices.has(randomIndex)) {
        selectedIndices.add(randomIndex);
        resultArray.push(entriesArray[randomIndex]);
      }
    }

    return resultArray;
  }

  loadRandomObjectTiles(tilenames: Array<string>) {
    this.randomTiles = [...tilenames];
  }

  drawObjectFromArray(ary: Array<any>): void {
    ary.forEach(cell => {
      //select random object to draw
      const objectToDraw = chance.pickone(this.randomTiles as Array<string>);
      this.context?.drawImage(
        this.tiles[objectToDraw],
        0,
        0,
        16,
        16,
        cell[0] * this.tilesize,
        cell[1] * this.tilesize,
        this.tilesize,
        this.tilesize
      );
    });
  }

  async getMapImage(): Promise<HTMLImageElement> {
    return new Promise(resolve => {
      this.levelImage.onload = () => {
        resolve(this.levelImage);
      };
      this.levelImage.src = this.canvas.toDataURL();
    });
  }

  getMapImageSize(): { x: number; y: number } {
    return { x: this.tilesize * this.width, y: this.tilesize * this.height };
  }
}
