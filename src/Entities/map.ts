import { v4 as uuidv4 } from "uuid";
import { Entity } from "../../_SqueletoECS/entity";
import { Vector } from "../../_SqueletoECS/Vector";

export class MapEntity {
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

  static async create(img: HTMLImageElement, w: number, h: number) {
    return Entity.create({
      id: uuidv4(),
      components: {
        type: { data: "map" },
        zindex: 1,
        size: { data: [w, h] },
        position: new Vector(0, 0),
        orientation: 0,
        sprites: [
          {
            src: img.src,
            size: [w, h],
            angle: 0,
            anchor: [0, 0],
            offset: [0, 0],
          },
        ],
      },
    });
  }
}
