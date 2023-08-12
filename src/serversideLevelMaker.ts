import { makeMaze, addMapRooms } from "./mazemaker.js";

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

  constructor(public width: number, public height: number, public tilesize: number) {}

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
}
