import * as dgram from "dgram";
import { Packet, MessageType, MessageCode, Option, Options, OptionValue } from "./packet";
import { Observable, Subscription, Observer } from 'rxjs';

export class Client {
    TOKEN_LENGTH = 4;
    socket: dgram.Socket = null;
    messageId = 0;
    token = 0;
    callbacks = new Map<string, Function>();
    timouts = new Map<string, Function>();

    constructor(private address:string, private port: number) {
        this.socket = dgram.createSocket('udp4');
        this.socket.on('message', (msg, rinfo) => {
            let packet = Packet.parse(msg);

            let token = packet.token.toString('hex');

            let callback = this.callbacks.get(token);
            if (callback !== undefined) {
                callback(packet);

                if (packet.options.contains(OptionValue.OBSERVE)){
                    this.callbacks.delete(token);
                }
                this.timouts.delete(token);
            }
        });
    }

    get(uri: string) : Promise<Packet>{
        return new Promise((resolve, reject)=>{
            let packet = this.makePacket(MessageType.CON, MessageCode.GET, uri, Buffer.from([]));
            this.sendMessage(packet, resolve, reject);
        });
    }

    observe(uri: string) : Observable<Packet> {
        return new Observable((observer)=>{
            let packet = this.makePacket(MessageType.CON, MessageCode.GET, uri, Buffer.from([]));

            packet.options.push(new Option(OptionValue.OBSERVE, new Buffer([0])));
            this.sendMessage(packet, (packet)=>{
                //success
                console.log("received response");
                observer.next(packet);
            }, ()=>{
                //error
            });

        });
    }
    

    post(uri: string, buffer: Buffer = null) : Promise<Packet>{
        return new Promise((resolve, reject)=>{
            let packet = this.makePacket(MessageType.CON, MessageCode.POST, uri, buffer);
            this.sendMessage(packet, resolve, reject);
        });
    }

    put(uri: string, buffer: Buffer = null) : Promise<Packet>{
        return new Promise((resolve, reject)=>{
            let packet = this.makePacket(MessageType.CON, MessageCode.PUT, uri, buffer);
            this.sendMessage(packet, resolve, reject);
        });
    }

    delte(uri: string) : Promise<Packet>{
        return new Promise((resolve, reject)=>{
            let packet = this.makePacket(MessageType.CON, MessageCode.DELETE, uri, Buffer.from([]));
            this.sendMessage(packet, resolve, reject);
        });
    }

    private makePacket(type: MessageType, code: MessageCode, uri: string, buffer: Buffer) {
        let options = Options.from(uri.split("/").filter(part => part).map((part) => {
            return new Option(OptionValue.URI_PATH, new Buffer(part));
        }));
        let tokenBuf = new Buffer(this.TOKEN_LENGTH);
        tokenBuf.writeUInt32BE(this.token++, 0);
        let packet = new Packet(type, code, this.messageId++,
            tokenBuf, options, buffer);
        return packet;
    }

    sendMessage(packet : Packet, resolve, reject) {
        this.callbacks.set(packet.token.toString('hex'), resolve);
        let timout = () => {
            reject();
            this.callbacks.delete(packet.token.toString('hex'));
            this.timouts.delete(packet.token.toString('hex'));
        }
        setTimeout(()=>{
            let timeout = this.timouts.get(packet.token.toString('hex'));
            if (timeout !== undefined) {
                timout();
            }
        }, 3000);
        this.timouts.set(packet.token.toString('hex'), timout);
        this.socket.send(packet.serialize(), this.port, this.address);
    }
}