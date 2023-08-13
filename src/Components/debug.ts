import { Component } from "../../_SqueletoECS/component";
import { UI } from "@peasy-lib/peasy-ui";

// you can define the incoming types when the component is created
export interface IDebugComponent {
  data: boolean;
  w: number;
  h: number;
}
export type DebugType = DebugComp;

// this is the exported interface that is used in systems modules
export interface DebugComponent {
  debug: DebugType;
}

// classes should have:
// if UI element, a template property with the peasy-ui template literal
// if no UI aspect to the system, do not define a template
// a 'value' property that will be attached to the entity
export class DebugComp extends Component {
  // UI template string literal with UI binding of value property
  myCanvas: HTMLCanvasElement | undefined = undefined;
  myCtx: CanvasRenderingContext2D | null = null;
  parentdiv: HTMLElement | undefined = undefined;
  cnvW = 0;
  cnvH = 0;
  public template = `
    <style>
      .debug-component {
        position: absolute;
        top: 0px;
        left: 0px;
        }
    </style>
    <canvas \${==>myCanvas} class="debug-component" width="\${cnvW}" height="\${cnvH}"></canvas>
    
    `;

  //setting default value
  public value: DebugType | undefined;
  public constructor() {
    //@ts-ignore
    super("debug", DebugComp, false);
  }

  public define(data: IDebugComponent): void {
    if (data == null) {
      return;
    }
    this.cnvH = data.h;
    this.cnvW = data.w;
    UI.queue(() => {
      if (this.myCanvas) (this.myCtx as CanvasRenderingContext2D | null) = this.myCanvas.getContext("2d");
    });
    /*  (this.myCanvas as HTMLCanvasElement) = document.createElement("canvas");
    if (this.myCanvas) {
      (this.myCtx as CanvasRenderingContext2D | null) = this.myCanvas.getContext("2d");
      this.myCanvas.width = data.w;
      this.myCanvas.height = data.h;
      (this.parentdiv as HTMLElement).appendChild(this.myCanvas);
    } */
  }
}
