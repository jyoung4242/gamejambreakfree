import { Component } from "../../_SqueletoECS/component";

export interface IAngVelocity {
  data: number;
}

export type angVelocityType = number;

export interface AngVelocityComponent {
  angVelocity: angVelocityType;
}

export class angVelocity extends Component {
  public value = 0;
  public constructor() {
    //@ts-ignore
    super("angVelocity", angVelocity, true);
  }

  public define(data: IAngVelocity): void {
    if (data == null) {
      return;
    }
    this.value = data.data;
  }
}
