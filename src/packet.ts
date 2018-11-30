
let tokenValue = 0;

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

export const MSG_CODE = {
	GET: new MessageCode(0, 1)
} 

export class Option{
	constructor(public number: number, public data: Buffer){

	}
}

export class Options extends Array {

	static from(data: Option[]): Options{
		let options = new Options();
		options.push(...data);
		return options;
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

}

export class Packet {
	version = 1;
	token: Buffer = new Buffer(4);

	constructor(
		public type: MessageType,
		public code: MessageCode,
		public messageId: number,
		public options: Options,
		public payload: Buffer,
	) {
		this.token.writeInt32LE(tokenValue++, 0);
	}

	public serialize(): Buffer {
		const tokenLength = this.token ? this.token.length : 0;
		const optionsBuffer = this.options.serialize();
		const payloadLength = (this.payload && this.payload.length > 0) ? this.payload.length : -1; // -1 to offset the payload byte for empty payloads
		const ret = Buffer.allocUnsafe(4 + tokenLength + optionsBuffer.length + 1 + payloadLength);

		let offset = 0;
		ret[offset++] = ((this.version & 0b11) << 6) + ((this.type & 0b11) << 4) + (tokenLength & 0b1111);
		ret[offset++] = this.code.value;
		ret[offset++] = (this.messageId >>> 8) & 0xff;
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

	
}