import { Schema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("number")
  public x = Math.floor(Math.random() * 400);

  @type("number")
  public y = Math.floor(Math.random() * 400);
}
