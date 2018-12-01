import * as dgram from "dgram";
import { Packet, MessageType, MessageCode, MSG_CODE, Option, Options, OptionValue } from "./packet";

export class Client {
    TOKEN_LENGTH = 4;
    socket: dgram.Socket = null;
    messageId = 0;
    token = 0;
    callbacks = new Map<string, Function>();

    constructor(private address:string, private port: number) {
        this.socket = dgram.createSocket('udp4');
        this.socket.on('message', (msg, rinfo) => {
            let packet = Packet.parse(msg);

            let token = packet.token.toString('hex');

            let callback = this.callbacks.get(token);
            if (callback !== undefined) {
                callback(packet);
                this.callbacks.delete(token);
            }
        });
    }

    get(uri: string) : Promise<Packet>{
        return new Promise((resolve, reject)=>{
            let options = Options.from(
                uri.split("/").filter(part => part).map((part)=>{
                    return new Option(OptionValue.URI_PATH, new Buffer(part))
                })
            );

            let tokenBuf = new Buffer(this.TOKEN_LENGTH);
            tokenBuf.writeUInt32BE(this.token++, 0);

            let packet = new Packet(
                MessageType.CON,
                MSG_CODE.GET,
                this.messageId++,
                tokenBuf,
                options,
                Buffer.from([])
            );

            this.sendMessage(packet, resolve, reject);
        });
    }

    sendMessage(packet : Packet, resolve, reject) {
        this.callbacks.set(packet.token.toString('hex'), resolve);

        //TODO handle reject for timout

        this.socket.send(packet.serialize(), this.port, this.address);
    }
}