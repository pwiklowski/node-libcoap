import * as dgram from "dgram";
import { Packet, MessageType, MessageCode, MSG_CODE, Option, Options, OptionValue } from "./packet";

export class Client {
    socket: dgram.Socket = null;
    messageId = 0;

    constructor(private address:string, private port: number) {
        this.socket = dgram.createSocket('udp4');
        this.socket.on('message', this.messageHandler);
    }
    
    messageHandler(msg, rinfo) {
        console.log('I got this message: ', rinfo, msg);
    }

    get(uri: string) : Promise<Packet>{
        return new Promise((resolve, rejsct)=>{

            let options = Options.from([
                new Option(OptionValue.URI_PATH, new Buffer("counter"))
            ]);

            let payload: Buffer = new Buffer("test");

            let packet = new Packet(
                MessageType.CON,
                MSG_CODE.GET,
                this.messageId++,
                options,
                payload
            );

            this.sendMessage(packet);
        });
    }

    sendMessage(packet : Packet) {
        this.socket.send(packet.serialize(), this.port, this.address);
    }
}