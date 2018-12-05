import { Packet, Options, Option, MessageType, MessageCode, OptionValue } from "./packet";

test('if one option is properly serialized', () => {
    let options = Options.from([
        new Option(OptionValue.URI_PATH, new Buffer("counter"))
    ]);
    expect(options.serialize()).toEqual(new Buffer([183, 99, 111, 117, 110, 116, 101, 114]));
});

test('if one options are properly sorted', () => {
    let options = new Options();
    options.push(new Option(OptionValue.CONTENT_FORMAT, new Buffer([0x32])));
    options.push(new Option(OptionValue.URI_PATH, new Buffer("counter")));
    expect(options.serialize()).toEqual(new Buffer([183, 99, 111, 117, 110, 116, 101, 114, 0x11, 0x32]));
});


test('if two option is properly serialized', () => {
    let options = new Options();
    options.push(new Option(OptionValue.URI_PATH, new Buffer("counter")));
    options.push(new Option(OptionValue.CONTENT_FORMAT, new Buffer([0x32])));
    expect(options.serialize()).toEqual(new Buffer([183, 99, 111, 117, 110, 116, 101, 114, 0x11, 0x32]));
});

test('if 4 option with complex path is properly serialized', () => {
    let options = new Options();
    options.push(new Option(OptionValue.URI_PATH, new Buffer("counter")));
    options.push(new Option(OptionValue.URI_PATH, new Buffer("pr")));
    options.push(new Option(OptionValue.URI_PATH, new Buffer("count")));
    options.push(new Option(OptionValue.CONTENT_FORMAT, new Buffer([0x32])));
    expect(options.serialize()).toEqual(new Buffer([183, 99, 111, 117, 110, 116, 101, 114, 
        0x02, 0x70, 0x72,
        0x05, 0x63, 0x6f, 0x75, 0x6e, 0x74,
        0x11, 0x32]));
});

test('if packet is properly serialized', ()=>{
    let options = Options.from([
        new Option(OptionValue.URI_PATH, new Buffer("counter")),
        new Option(OptionValue.CONTENT_FORMAT, new Buffer([0x32]))
    ]);

    let payload: Buffer = new Buffer([]);
    let tokenBuf = new Buffer(4);
    tokenBuf.writeUInt32BE(this.token++, 0);
    let packet = new Packet(
        MessageType.CON,
        MessageCode.GET,
        0,
        tokenBuf,
        options,
        payload
    );

    expect(packet.serialize()).toEqual(new Buffer("4401000000000000b7636f756e7465721132","hex"));
});

test('if options are properly parsed', ()=>{
    let data = new Buffer([183, 99, 111, 117, 110, 116, 101, 114, 
        0x02, 0x70, 0x72,
        0x05, 0x63, 0x6f, 0x75, 0x6e, 0x74,
        0x11, 0x32]);

    let options = new Options();

    let len = Options.parse(options, data);

    expect(len).toEqual(data.length);
    expect(options.length).toEqual(4);


});

test('if packet is properly parsed', ()=>{
    let data = new Buffer("4401000000000000b7636f756e7465721132","hex")
    let packet = Packet.parse(data);
    console.log(packet);
    expect(packet.version).toEqual(1);
    expect(packet.type).toEqual(MessageType.CON);
    expect(packet.code).toEqual(MessageCode.GET);
    expect(packet.messageId).toEqual(0);
    expect(packet.options.length).toEqual(2);
    expect(packet.payload.length).toEqual(0);

});