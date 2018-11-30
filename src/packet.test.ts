import { Packet, Options, Option, MessageType, MSG_CODE, OptionValue } from "./packet";

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
        new Option(11, new Buffer("counter")),
        new Option(OptionValue.CONTENT_FORMAT, new Buffer([0x32]))
    ]);

    let payload: Buffer = new Buffer([]);

    let packet = new Packet(
        MessageType.CON,
        MSG_CODE.GET,
        0,
        options,
        payload
    );

    expect(packet.serialize()).toEqual(new Buffer("4401000000000000b7636f756e7465721132","hex"));
});