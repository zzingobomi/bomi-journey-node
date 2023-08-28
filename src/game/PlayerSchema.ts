/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Schema, type, MapSchema } from "@colyseus/schema";

export class Player extends Schema {
  // @ts-ignore
  @type("number")
  public x = Math.floor(Math.random() * 400);

  // @ts-ignore
  @type("number")
  public y = Math.floor(Math.random() * 400);
}

export class State extends Schema {
  // @ts-ignore
  @type({ map: Player })
  players = new MapSchema<Player>();

  createPlayer(peerId: string) {
    this.players.set(peerId, new Player());
  }

  removePlayer(peerId: string) {
    this.players.delete(peerId);
  }

  movePlayer(peerId: string, movement: any) {
    if (movement.x) {
      this.players.get(peerId).x += movement.x * 10;
    } else if (movement.y) {
      this.players.get(peerId).y += movement.y * 10;
    }
  }
}
