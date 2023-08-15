import { Component } from "../../_SqueletoECS/component";

export interface IhealthComponent {
  data: string;
}

export type healthType = number;

export interface NameComponent {
  health: healthType;
}

export class healthComp extends Component {
  public value = 0;
  public constructor() {
    //@ts-ignore
    super("health", healthComp, true);
  }

  public define(data: number): void {
    if (data == null) {
      return;
    }
    this.value = data;
  }
}
