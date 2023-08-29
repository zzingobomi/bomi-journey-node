/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

console.log(
  '👋 This message is being logged by "renderer.js", included via webpack'
);

import "./mvp.css";
import "./index.css";
import { P2P } from "@src/p2p";
import { GameServer } from "@src/game/GameServer";
import { addSelectList, addText, removeSelectList, replaceText } from "./utils";

export class App {
  p2pNode: P2P;
  p2pGame: P2P;
  gameServer: GameServer;

  constructor() {
    // NodeP2P 세팅
    this.p2pNode = new P2P(
      process.env.WS_SCHEME,
      process.env.WS_HOST,
      process.env.WS_PORT
    );
    this.p2pNode.Init("noderoom1", "node");
    this.p2pNode.onSocketConnected = (socketId: string) => {
      replaceText("socket-id-node", socketId);
    };
    this.p2pNode.onAddPeerConnection = (otherSocketId: string) => {
      addSelectList("others-node", otherSocketId);
    };
    this.p2pNode.onRemovePeerConnection = (otherSocketId: string) => {
      removeSelectList("socket-id-node", otherSocketId);
    };
    this.p2pNode.onConnectionStateChange = (
      otherSocketId: string,
      ev: Event
    ) => {
      console.log(
        otherSocketId,
        (ev.currentTarget as RTCPeerConnection).connectionState
      );
    };
    this.p2pNode.onReceiveChannelMessage = (
      otherSocketId: string,
      ev: MessageEvent<any>
    ) => {
      addText("received-node", ev.data);
    };

    // GameP2P 세팅
    this.p2pGame = new P2P(
      process.env.WS_SCHEME,
      process.env.WS_HOST,
      process.env.WS_PORT
    );
    this.p2pGame.Init("userroom1", "gameserver");

    // GameServer 세팅
    this.gameServer = new GameServer();

    // Usage
    document
      .getElementById("send-button-node")
      .addEventListener("click", () => {
        const msgInputEle = document.getElementById(
          "message-node"
        ) as HTMLInputElement;
        const toSelectEle = document.getElementById(
          "others-node"
        ) as HTMLSelectElement;

        this.p2pNode.Send(
          toSelectEle.value,
          `from ${this.p2pNode.socket.id}: ${msgInputEle.value}`
        );

        msgInputEle.value = "";
      });
  }
}

new App();
