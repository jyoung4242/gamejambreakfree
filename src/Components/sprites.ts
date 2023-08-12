import { Vector } from "../../_SqueletoECS/Vector";
import { Component } from "../../_SqueletoECS/component";

// you can define the incoming types when the component is created
export type AnimationSequence = {
  frameRate: number;
  default: string;
  sequences: IAnimSequence;
};

export interface IAnimSequence {
  [key: string]: Array<Array<number>>;
}

export interface ISpritesComponent {
  data: SpritesType | Array<SpritesType>;
}
export type SpritesType = {
  src: string;
  size: Array<number>;
  animation?: AnimationSequence;
};

export type spriteObject = {
  src: string;
  size: Vector;
  position?: Vector;
  offset: Vector;
  animationSequence?: AnimationSequence;
  frameIndex?: number;
  frameRate?: number;
  frameTik?: number;
  angle: number;
  currentSequence?: string;
  anchor: Vector;
  fit: string;
  flip: "1" | "-1";
};

// this is the exported interface that is used in systems modules
export interface SpritesComponent {
  sprites: Array<spriteObject>;
}

// classes should have:
// if UI element, a template property with the peasy-ui template literal
// if no UI aspect to the system, do not define a template
// a 'value' property that will be attached to the entity
export class SpritesComp extends Component {
  // UI template string literal with UI binding of value property
  public template = `
    <style>
      sprite-layer {
        position: absolute;
        width: 100%;
        height: 100%;
        display: block;
        image-rendering: pixelated;
        background-repeat: no-repeat;
      }
    </style>
    <sprite-layers style="position: relative">
      <sprite-layer \${sprite<=*value} style="transform-origin: \${sprite.anchor.x}px \${sprite.anchor.y}px; width: \${sprite.size.x}px; height: \${sprite.size.y}px; top: \${sprite.offset.y}px;left: \${sprite.offset.x}px;background-image: url(\${sprite.src}); background-position: -\${sprite.position.x}px \${sprite.position.y}px; transform: rotate(\${sprite.angle}deg) scaleX(\${sprite.flip});  background-size: \${sprite.fit}; "></sprite-layer>
    </sprite-layers>
    `;

  //setting default value
  public value: Array<spriteObject> = [];
  public constructor() {
    //@ts-ignore
    super("sprites", SpritesComp, true);
  }

  public define(data: ISpritesComponent): void {
    if (data == null) {
      return;
    }
    let sprites = [];
    if (!Array.isArray(data)) {
      sprites = [data];
    } else sprites = [...data];

    for (const sprite of sprites) {
      //setup as static image first;
      let currentSprite: spriteObject = {
        src: sprite.src,
        size: new Vector(sprite.size[0], sprite.size[1]),
        offset: new Vector(sprite.offset[0], sprite.offset[1]),
        angle: sprite.angle,
        anchor: new Vector(sprite.anchor.x, sprite.anchor.y),
        fit: sprite.fit,
        flip: sprite.flip ? sprite.flip : "1",
      };

      if (sprite.animation) {
        currentSprite.animationSequence = sprite.animation;
        currentSprite.frameIndex = 0;
        currentSprite.frameRate = sprite.animation.frameRate;
        currentSprite.frameTik = 0;
        currentSprite.position = new Vector(0, 0);
        currentSprite.currentSequence = sprite.animation.default;
      } else {
        currentSprite.position = new Vector(0, 0);
      }

      this.value.push(currentSprite);
    }
  }
}
