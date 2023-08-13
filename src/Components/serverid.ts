import { Component } from "../../_SqueletoECS/component";

export interface IsidComponent {
  sid: string;
}

export type sidType = string;

export interface NameComponent {
  sid: sidType;
}

export class sID extends Component {
  public value = "";
  public constructor() {
    //@ts-ignore
    super("sid", sID, true);
  }

  public define(data: string): void {
    if (data == null) {
      return;
    }
    this.value = data;
  }
}
