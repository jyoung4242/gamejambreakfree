import { Component } from "../../_SqueletoECS/component";

export interface IborderComponent {
  data: {
    radius: number;
    color: string;
  };
}

export type borderType = {
  radius: number;
  color: string;
};

export interface NameComponent {
  border: borderType;
}

export class borderComp extends Component {
  public value: borderType = {
    radius: 0,
    color: "transparent",
  };
  public constructor() {
    //@ts-ignore
    super("border", borderComp, true);
  }

  public define(data: IborderComponent): void {
    if (data == null) {
      return;
    }
    this.value.radius = data.data.radius;
    this.value.color = data.data.color;
  }
}
