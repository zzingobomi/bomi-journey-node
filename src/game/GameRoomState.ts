import { MapSchema, Schema, type } from "@colyseus/schema";
import { Player } from "./PlayerSchema";

export class GameRoomState extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();

  addPlayer(rtcSocketId: string) {
    this.players.set(rtcSocketId, new Player());
  }

  removePlayer(rtcSocketId: string) {
    this.players.delete(rtcSocketId);
  }

  movePlayer(rtcSocketId: string, movement: any) {
    if (movement.x) {
      this.players.get(rtcSocketId).x += movement.x * 10;
    } else if (movement.y) {
      this.players.get(rtcSocketId).y += movement.y * 10;
    }
  }
}
