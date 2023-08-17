import { Component } from "../../_SqueletoECS/component";

// you can define the incoming types when the component is created
export interface IColorComponent {
  data: ColorType;
}
export type ColorType = string;

// this is the exported interface that is used in systems modules
export interface ColorComponent {
  color: ColorType;
}

// classes should have:
// if UI element, a template property with the peasy-ui template literal
// if no UI aspect to the system, do not define a template
// a 'value' property that will be attached to the entity
export class ColorComp extends Component {
  // UI template string literal with UI binding of value property
  public template = `
  <style>
    .color-component {
      position: relative;
      width: 16px;
      height: 16px;
      top: 0px;
      left: 0px;
    }
  </style>
  <div class="color-component" style="background-color: \${value};"></div>
  `;

  //setting default value
  public value: ColorType = "transparent";
  public constructor() {
    //@ts-ignore
    super("color", ColorComp, true);
  }

  public define(data: IColorComponent): void {
    if (data == null) {
      return;
    }

    this.value = data.data;
  }
}
