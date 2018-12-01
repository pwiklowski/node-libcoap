import { Client } from "./client";
import { Packet } from "./packet";


let client = new Client("127.0.0.1", 5683);

client.get("/").then((message:Buffer)=>{
    console.log("received response", message.toString());
});
client.get("/counter").then((message:Buffer)=>{
    console.log("received response", message.toString());
});
client.get("/counter/pr/count").then((message:Buffer)=>{
    console.log("received response", message.toString());
});