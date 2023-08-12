import { Component } from "../../_SqueletoECS/component";

export interface INameComponent {
  name: string;
}

export type NameType = string;

export interface NameComponent {
  name: NameType;
}

export class Name extends Component {
  public template = `
    <style>
      .name-component {
        color: white;
        position: absolute;
        font-size: 6px;
        font-weight: bold;
        width: 50px;
        height: 16px;
        top: -16px;
        left: -26px;
        text-align: center;
        z-index: 3;
      }
    </style>
    <div class="name-component">\${value}</div>
    `;

  public value = "";
  public constructor() {
    //@ts-ignore
    super("name", Name, true);
  }

  public define(data: string): void {
    console.log("name define: ", data);

    if (data == null) {
      return;
    }
    console.log("name:", data);

    this.value = data;
  }
}
