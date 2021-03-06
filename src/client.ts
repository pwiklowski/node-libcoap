import * as dgram from "dgram";
import { Packet, MessageType, MessageCode, Option, Options, OptionValue } from "./packet";
import { Observable, Subscription, Observer } from 'rxjs';

export class Response { 
    packet: Packet;
    remote: dgram.RemoteInfo;
}

export class Client {
    TOKEN_LENGTH = 4;
    socket: dgram.Socket = null;
    messageId = 0;
    token = 0;
    callbacks = new Map<string, Function>();
    timouts = new Map<string, Function>();


    constructor(private address:string, private port: number) {
        this.socket = dgram.createSocket('udp4');
        this.socket.on('message', (msg, remote) => {
            let packet = Packet.parse(msg);

            let token = packet.token.toString('hex');

            let callback = this.callbacks.get(token);
            if (callback !== undefined) {
                callback({packet, remote});

                if (packet.type === MessageType.CON){
                    this.ack(packet);
                }

                if (packet.options.contains(OptionValue.OBSERVE)){
                    this.callbacks.delete(token);
                }
                this.timouts.delete(token);
            }
        });
    }

    get(uri: string) : Promise<Response>{
        return new Promise((resolve, reject)=>{
            let packet = this.makePacket(MessageType.CON, MessageCode.GET, uri, Buffer.from([]));
            this.sendMessage(packet, resolve, reject);
        });
    }

    observe(uri: string) : Observable<Response> {
        return new Observable((observer)=>{
            let observe = this.makePacket(MessageType.CON, MessageCode.GET, uri, Buffer.from([]));
            observe.options.push(new Option(OptionValue.OBSERVE, new Buffer([0])));

            this.sendMessage(observe, (response)=>{
                observer.next(response);
            }, ()=>{
                //error
            });

        });
    }
    

    post(uri: string, buffer: Buffer = null) : Promise<Response>{
        return new Promise((resolve, reject)=>{
            let packet = this.makePacket(MessageType.CON, MessageCode.POST, uri, buffer);
            this.sendMessage(packet, resolve, reject);
        });
    }

    put(uri: string, buffer: Buffer = null) : Promise<Response>{
        return new Promise((resolve, reject)=>{
            let packet = this.makePacket(MessageType.CON, MessageCode.PUT, uri, buffer);
            this.sendMessage(packet, resolve, reject);
        });
    }

    delte(uri: string) : Promise<Response>{
        return new Promise((resolve, reject)=>{
            let packet = this.makePacket(MessageType.CON, MessageCode.DELETE, uri, Buffer.from([]));
            this.sendMessage(packet, resolve, reject);
        });
    }

    private makePacket(type: MessageType, code: MessageCode, uri: string, buffer: Buffer,
         token: Buffer = undefined, messaggeId: number = undefined) {

        let options = new Options();
        if (uri) {
            options = Options.from(uri.split("/").filter(part => part).map((part) => {
                return new Option(OptionValue.URI_PATH, new Buffer(part));
            }));
        }
        let tokenBuf = new Buffer(this.TOKEN_LENGTH);

        if (token !== undefined){
            token.copy(tokenBuf);
        }else{
            tokenBuf.writeUInt32BE(this.token++, 0);
        }

        let mid = messaggeId;

        if (mid === undefined) {
            mid = this.messageId++;
        }

        let packet = new Packet(type, code, mid,
            tokenBuf, options, buffer);
        return packet;
    }

    sendMessage(packet : Packet, resolve, reject) {
        if (resolve != null){
            this.callbacks.set(packet.token.toString('hex'), resolve);
            let timeout = () => {
                reject();
                this.callbacks.delete(packet.token.toString('hex'));
                this.timouts.delete(packet.token.toString('hex'));
            }
            setTimeout(()=>{
                let timeout = this.timouts.get(packet.token.toString('hex'));
                if (timeout !== undefined) {
                    timeout();
                }
            }, 3000);
            this.timouts.set(packet.token.toString('hex'), timeout);
        }

        this.socket.send(packet.serialize(), this.port, this.address);
    }

    private ack(packet: Packet) {
        let p = this.makePacket(MessageType.ACK, packet.code, "", Buffer.from([]), packet.token, packet.messageId);
        this.sendMessage(p, null, null);
    }
}