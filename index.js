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

const main = async()=>{
    let [file] = process.argv.slice(2);
    assert(file, 'Must specify a PNG file path argument');
    let fd = await fs.open(file);
    await read_signature(fd);
};

if (require.main==module)
    main().catch(console.error);