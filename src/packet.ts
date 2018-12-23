import * as cbor from "borc";

export enum MessageType {
	CON = 0, 
	NON = 1,
	ACK = 2,
	RST = 3,
}

export enum OptionValue {
	IF_MATCH = 1,
	URI_HOST = 3,
	ETAG = 4,
	IF_NONE_MATCH = 5,
	OBSERVE = 6,
	URI_PORT = 7,
	LOCATION_PATH = 8,
	URI_PATH = 11,
	CONTENT_FORMAT = 12,
	MAX_AGE = 14,
	URI_QUERY = 15,
	ACCEPT = 17, 
	LOCATION_QUERY = 20,
	PROXY_URI = 35,
	PROXY_SCHEME = 39
}

export class MessageCode {
	static GET = new MessageCode(0, 1);
	static POST = new MessageCode(0, 2);
	static PUT = new MessageCode(0, 3);
	static DELETE = new MessageCode(0, 4);

	constructor(public readonly major: number, public readonly minor: number) {

	}

	public static from(value: number) {
		return new MessageCode((value >>> 5) & 0b111, value & 0b11111,
		);
	}

	public get value(): number {
		return ((this.major & 0b111) << 5) + (this.minor & 0b11111);
	}
}

export class Option{
	constructor(public number: OptionValue, public data: Buffer){

	}
}

export enum ContentType {
	UNKNOWN = -1, 
	TEXT_PLAIN = 0,
	APPLICATION_LINKFORMAT  = 40,
	APPLICATION_XML         = 41,
	APPLICATION_OCTETSTREAM = 42,
	APPLICATION_EXI         = 47,
	APPLICATION_JSON        = 50,
	APPLICATION_CBOR        = 60,
}

export class Options extends Array {

	static from(data: Option[]): Options{
		let options = new Options();
		options.push(...data);
		return options;
	}

	contains(option: OptionValue) : boolean {
		this.forEach(element => {
			if (element.number === option){
				return true;
			}
		});
		return false;
	}

	serialize(): Buffer {
		if (this && this.length) {
			let delta = 0;
			return Buffer.concat(this.sort((a, b)=>{
				return a.number - b.number;
			}).map((o, i, opts) => {
				let optionDelta = o.number - delta;
				let payloadLength = o.data.byteLength;
				const totalLength = 1 + payloadLength;
				const ret = Buffer.allocUnsafe(totalLength);
				ret[0] = (optionDelta << 4) + payloadLength;
				o.data.copy(ret, 1, 0);
				delta = o.number;
				return ret;
			}));
		}
		else {
			return Buffer.from([]);
		}
	}

	static parse(options:Options, buf:Buffer):number{
		let offset = 0;
		let num = 0;
		while(buf[offset] !== 0xFF && buf[offset] !== undefined) {
			let number = buf[offset] >> 4;
			let length = buf[offset] & 0xF;
			options.push(new Option(number+num, buf.slice(offset+1, offset+length+1)));
			offset += length + 1;
			num = number + num;
		}
		return offset;
	}
}

export class Packet {
	version = 1;

	constructor(
		public type: MessageType,
		public code: MessageCode,
		public messageId: number,
		public token: Buffer,
		public options: Options,
		public payload: Buffer,
	) {
	}

	public static parse(buf: Buffer): Packet {
		const version = (buf[0] >>> 6) & 0b11;
		const type = (buf[0] >>> 4) & 0b11;
		const tokenLength = buf[0] & 0b1111;
		const code = MessageCode.from(buf[1]);
		const messageId = buf[3] | (buf[2]<<8);

		const token = Buffer.alloc(tokenLength);
		if (tokenLength > 0) buf.copy(token, 0, 4, 4 + tokenLength);
		
		let optionsStart = 4 + tokenLength;

		let options = new Options();
		let payloadStart = Options.parse(options, buf.slice(optionsStart)) + optionsStart;

		let payload: Buffer;
		if (payloadStart < buf.length && buf[payloadStart] === 0xff) {
			payload = Buffer.from(buf.slice(payloadStart + 1));
		} else {
			payload = Buffer.from([]);
		}

		return new Packet(
			type, code, messageId, token, options, payload,
		);
	}

	public serialize(): Buffer {
		const tokenLength = this.token ? this.token.length : 0;
		const optionsBuffer = this.options.serialize();
		const payloadLength = (this.payload && this.payload.length > 0) ? this.payload.length : -1; // -1 to offset the payload byte for empty payloads
		const ret = Buffer.allocUnsafe(4 + tokenLength + optionsBuffer.length + 1 + payloadLength);

		let offset = 0;
		ret[offset++] = ((this.version & 0b11) << 6) + ((this.type & 0b11) << 4) + (tokenLength & 0b1111);
		ret[offset++] = this.code.value;
		ret[offset++] = (this.messageId >> 8) & 0xff;
		ret[offset++] = this.messageId & 0xff;

		if (tokenLength > 0) {
			this.token.copy(ret, offset);
			offset += tokenLength;
		}

		if (optionsBuffer.length > 0) {
			optionsBuffer.copy(ret, offset);
			offset += optionsBuffer.length;
		}

		if (payloadLength > 0) {
			ret[offset] = 0xff;
			this.payload.copy(ret, offset + 1);
		}

		return ret;
	}

	getPayloadObject() {
		let contentType = this.getPayloadContentType();

		if (contentType === ContentType.APPLICATION_CBOR){
			return cbor.decodeFirst(this.payload);
		} else if (contentType === ContentType.APPLICATION_JSON) {
			return this.payload.toString();
		}
		return null;
	}

	getPayloadContentType() : ContentType {
		let type = ContentType.UNKNOWN;
		this.options.forEach((option:Option)=>{
			if (option.number === OptionValue.CONTENT_FORMAT){
				type = option.data.readIntBE(0, option.data.length);
				return;
			}
		});
		return type;
	}
}