import { Client } from "./client";
import { Packet } from "./packet";


let client = new Client("127.0.0.1", 5683);

client.get("/").then((message:Packet)=>{
    console.log("received response", message);
}).catch(()=>{
    console.log("timeout");
});
client.get("/counter").then((message:Packet)=>{
    console.log("received response", message);
}).catch(()=>{
    console.log("timeout");
});
client.get("/counter/pr/count").then((message:Packet)=>{
    console.log("received response", message);
}).catch(()=>{
    console.log("timeout");
});