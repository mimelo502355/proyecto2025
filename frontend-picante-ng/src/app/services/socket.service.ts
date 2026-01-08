import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private client: Client | null = null;
  private subjects: { [topic: string]: Subject<any> } = {};

  connect(): void {
    if (this.client && this.client.active) return;
    const socketUrl = 'http://localhost:8080/ws';
    this.client = new Client({
      webSocketFactory: () => new SockJS(socketUrl) as any,
      reconnectDelay: 5000,
    });

    this.client.onConnect = () => {
      // resubscribe to topics
      Object.keys(this.subjects).forEach(t => this.subscribeTopicInternal(t));
    };

    this.client.activate();
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }

  subscribe(topic: string): Observable<any> {
    if (!this.subjects[topic]) this.subjects[topic] = new Subject<any>();
    this.connect();
    this.subscribeTopicInternal(topic);
    return this.subjects[topic].asObservable();
  }

  private subscribeTopicInternal(topic: string): void {
    if (!this.client || !this.client.active) return;
    // avoid double subscriptions by checking existing
    const sub: StompSubscription = this.client.subscribe(topic, (message: IMessage) => {
      try {
        const body = JSON.parse(message.body);
        this.subjects[topic].next(body);
      } catch (e) {
        this.subjects[topic].next(message.body);
      }
    });
    // no need to keep reference; if client reconnects, onConnect will re-subscribe
  }
}
