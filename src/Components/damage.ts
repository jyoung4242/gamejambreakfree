import { Component } from "../../_SqueletoECS/component";

export interface IdamageComponent {
  data: string;
}

export type damageType = number;

export interface NameComponent {
  damage: damageType;
}

export class damageComp extends Component {
  public value = 0;
  public constructor() {
    //@ts-ignore
    super("damage", damageComp, true);
  }

  public define(data: number): void {
    if (data == null) {
      return;
    }
    this.value = data;
  }
}
