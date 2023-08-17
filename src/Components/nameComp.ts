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
       display:flex;
       flex-direction: column;
       justify-content: center;
       align-items: center;
        color: white;
        position: absolute;
        width: 100%;
        height: 16px;
       
        text-align: center;
        z-index: 3;
      }
    </style>
    <div class="name-component">
      <svg viewBox="0 0 60 60">
        <text class='caption' x="50%" y="50%" text-anchor="middle">\${value}</text>
      </svg>
    </div>
    `;

  public value = "";
  public constructor() {
    //@ts-ignore
    super("name", Name, true);
  }

  public define(data: string): void {
    if (data == null) {
      return;
    }
    console.log("name:", data);

    this.value = data;
  }
}
