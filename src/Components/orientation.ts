import { Component } from "../../_SqueletoECS/component";

// you can define the incoming types when the component is created
export interface IOrientationComponent {
  data: OrientationType;
}
export type OrientationType = number;

// this is the exported interface that is used in systems modules
export interface OrientationComponent {
  orientation: OrientationType;
}

export class OrientationComp extends Component {
  //setting default value
  public value: OrientationType = 0;
  public constructor() {
    //@ts-ignore
    super("orientation", OrientationComp, true);
  }

  public define(data: number): void {
    if (data == null) {
      return;
    }
    this.value = data;
  }
}
