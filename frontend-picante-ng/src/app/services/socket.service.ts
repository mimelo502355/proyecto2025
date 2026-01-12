import { Injectable } from '@angular/core';
// import { Client } from '@stomp/stompjs';
// import SockJS from 'sockjs-client';

@Injectable({ providedIn: 'root' })
export class SocketService {
  // private client: Client;
  isConnected: boolean = false;

  constructor() {
    // this.client = new Client({
    //   brokerURL: 'ws://localhost:8080/ws',
    //   webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
    //   reconnectDelay: 5000,
    //   connectionTimeout: 5000,
    // });
  }

  connect(): void {
    // if (this.isConnected) return;

    // this.client.onConnect = () => {
    //   this.isConnected = true;
    // };

    // this.client.onStompError = (frame: any) => {
    //   console.error('STOMP error', frame);
    // };

    // this.client.activate();
  }

  disconnect(): void {
    // if (this.isConnected) {
    //   this.client.deactivate();
    //   this.isConnected = false;
    // }
  }

  subscribe(destination: string, callback: (message: any) => void): void {
    // if (!this.isConnected) {
    //   this.connect();
    // }
    // this.client.subscribe(destination, (message: any) => {
    //   callback(JSON.parse(message.body));
    // });
  }

  send(destination: string, headers: any, body: any): void {
    // this.client.publish({
    //   destination,
    //   headers,
    //   body: JSON.stringify(body),
    // });
  }
}
