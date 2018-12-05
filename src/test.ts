import { Client } from "./client";
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
client.observe("/switch").subscribe((message:Packet)=>{
    console.log("received response", message);
    console.log(message.getPayloadObject());
});


module.exports = { Client, Packet }
