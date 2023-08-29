import { Schema, type, MapSchema } from "@colyseus/schema";

export class Player extends Schema {
  @type("number")
  public x = Math.floor(Math.random() * 400);

  @type("number")
  public y = Math.floor(Math.random() * 400);
}

export class State extends Schema {
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
