import { Component } from "../../_SqueletoECS/component";

export interface IoverflowComponent {
  data: boolean;
}

export type overflowType = string;

export interface NameComponent {
  overflow: overflowType;
}

export class overflowComp extends Component {
  public value: string = "visible";
  public constructor() {
    //@ts-ignore
    super("overflow", overflowComp, true);
  }

  public define(data: boolean): void {
    if (data == null) {
      return;
    }
    if (data == true) this.value = "hidden";
  }
}
