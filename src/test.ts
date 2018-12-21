import { Client, Response } from "./client";
import { Packet } from "./packet";
import * as cbor from "borc"


let client = new Client("127.0.0.1", 5683);

// client.get("/").then((message:Packet)=>{
//     console.log("received response",message.getPayloadContentType(), message);
//     console.log(message.getPayloadObject());
// }).catch(()=>{
//     console.log("timeout");
// });

// client.get("/counter").then((message:Packet)=>{
//     console.log("received response", message.getPayloadContentType(), message);
//     console.log(message.getPayloadObject());
// }).catch(()=>{
//     console.log("timeout");
// });
client.observe("/switch").subscribe((response:Response)=>{
    console.log("received response", response.packet);
    console.log(response.packet.getPayloadObject());
});


module.exports = { Client, Packet }
