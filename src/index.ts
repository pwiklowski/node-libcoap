import { Client } from "./client";
import { Packet } from "./packet";


let client = new Client("127.0.0.1", 5683);


client.get("/").then((message: Packet)=>{

});