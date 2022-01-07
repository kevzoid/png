'use strict';
const fs = require('fs/promises');
const assert = require('assert');
const eq = assert.equal;

// hex: 89 50 4E 47 0D 0A 1A 0A
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

const dec2hex = arr=>arr.map(int=>int.toString(16).padStart(2, 0)).join(' ');
const buf2hex = ([...buf])=>dec2hex(buf);

const read_signature = async fd=>{
    let sig_len = PNG_SIGNATURE.length
    let {buffer: buf, bytesRead: bytes_read} =
        await fd.read(new Uint8Array(sig_len), 0, sig_len);
    eq(bytes_read, sig_len, `couldn't read ${sig_len} bytes (${bytes_read})`);
    let png_sig = dec2hex(PNG_SIGNATURE), file_sig = buf2hex(buf);
    eq(png_sig, file_sig, `not a valid PNG (signature=${file_sig})`);
    console.log('Signature: %s', file_sig);
};

const read_chunks = async fd=>{
    let EOF;
    do {
        let size = (await fd.read(Buffer.alloc(4), 0, 4))
            .buffer.readUInt32BE(); // must be network byte order (big endian)
        let type = await fd.read(Buffer.alloc(4), 0, 4);
        // IEND in ascii
        EOF = !type.bytesRead || type.buffer.readUInt32BE()==0x49454e44;
        // seek the cursor to skip the data. there is no fseek equivilant in
        // nodejs. libuv also doesn't keep track of cursor position, it's
        // handled transparently by the os. see: https://github.com/nodejs/node/blob/b6b65101873c32655c8d71b4d73363d624f58770/lib/internal/fs/promises.js#L548
        await fd.read(Buffer.alloc(size), 0, size); 
        let crc = (await fd.read(Buffer.alloc(4), 0, 4)).buffer;
        console.log('-'.repeat(16));
        console.log('Chunk type: %s', type.buffer.toString('ascii'));
        console.log('Chunk size: %s', size);
        console.log('Chunk CRC: %s', '0x'+crc.toString('hex'));
    } while (!EOF);
};

const main = async()=>{
    let [file] = process.argv.slice(2);
    assert(file, 'Must specify a PNG file path argument');
    let fd = await fs.open(file);
    await read_signature(fd);
    await read_chunks(fd);
};

if (require.main==module)
    main().catch(console.error);