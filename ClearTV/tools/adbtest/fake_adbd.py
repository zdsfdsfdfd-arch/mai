#!/usr/bin/env python3
"""Minimal fake adbd for testing ClearTV's embedded ADB client (tools/adbtest/AdbClientTest.kt).

Implements the device side of the ADB transport: CNXN handshake with RSA auth (AUTH TOKEN -> SIGNATURE ->
RSAPUBLICKEY), OPEN "shell:<cmd>" streams, WRTE/OKAY/CLSE. Signature verification is done with pure-Python
RSA (pow(sig, e, n)) against the public key the client offers, exactly as adbd would after the user accepts
the prompt. Not a general adbd: only what the client under test needs.
"""
import base64, os, socket, struct, sys, threading

CNXN, AUTH, OPEN, OKAY, CLSE, WRTE = 0x4e584e43, 0x48545541, 0x4e45504f, 0x59414b4f, 0x45534c43, 0x45545257
A_TOKEN, A_SIGNATURE, A_RSAPUBLICKEY = 1, 2, 3
SHA1_PREFIX = bytes([0x30,0x21,0x30,0x09,0x06,0x05,0x2b,0x0e,0x03,0x02,0x1a,0x05,0x00,0x04,0x14])
KNOWN_KEYS = {}   # name -> (n, e)   (accepted "Always allow" keys)
LOG = []

def pack(cmd, a0, a1, data=b''):
    return struct.pack('<IIIIII', cmd, a0, a1, len(data), sum(data) & 0xffffffff, cmd ^ 0xffffffff) + data

def read_msg(f):
    h = f.read(24)
    if len(h) < 24: return None
    cmd, a0, a1, ln, chk, magic = struct.unpack('<IIIIII', h)
    assert magic == cmd ^ 0xffffffff, 'bad magic'
    return cmd, a0, a1, f.read(ln)

def parse_pubkey(blob):
    text = blob.rstrip(b'\0').decode('ascii')
    b64, _, name = text.partition(' ')
    raw = base64.b64decode(b64)
    assert len(raw) == 524, len(raw)
    words = struct.unpack('<I', raw[:4])[0]; assert words == 64
    n = int.from_bytes(raw[8:8+256], 'little')
    e = struct.unpack('<I', raw[520:524])[0]
    return name, n, e

def verify(sig, token, n, e):
    m = pow(int.from_bytes(sig, 'big'), e, n).to_bytes(256, 'big')
    expected = b'\x00\x01' + b'\xff' * (256 - 3 - len(SHA1_PREFIX) - len(token)) + b'\x00' + SHA1_PREFIX + token
    return m == expected

def run_shell(cmd):
    if cmd.startswith('echo '): return cmd[5:] + '\n', True
    if cmd.startswith('cmd package set-home-activity '): LOG.append(cmd); return 'Success\n', True
    if cmd == 'fail': return '', False
    return '/system/bin/sh: ' + cmd + ': not found\n', True

def handle(conn, auto_accept):
    f = conn.makefile('rb')
    m = read_msg(f)
    assert m and m[0] == CNXN, 'expected CNXN'
    token = os.urandom(20)
    conn.sendall(pack(AUTH, A_TOKEN, 0, token))
    authed = False
    while not authed:
        m = read_msg(f)
        assert m and m[0] == AUTH, 'expected AUTH'
        if m[1] == A_SIGNATURE:
            ok = any(verify(m[3], token, n, e) for (n, e) in KNOWN_KEYS.values())
            LOG.append('signature ' + ('ok' if ok else 'unknown-key'))
            if ok: authed = True
            else:
                token = os.urandom(20)
                conn.sendall(pack(AUTH, A_TOKEN, 0, token))
        elif m[1] == A_RSAPUBLICKEY:
            name, n, e = parse_pubkey(m[3])
            LOG.append('pubkey offered name=' + name)
            if auto_accept:
                KNOWN_KEYS[name] = (n, e)
                authed = True      # adbd sends CNXN right after the user accepts
            else:
                return
    conn.sendall(pack(CNXN, 0x01000001, 256 * 1024, b'device::ro.product.name=fake;features=cmd,shell_v2\0'))
    remote_id = 100
    while True:
        m = read_msg(f)
        if m is None: return
        cmd, a0, a1, data = m
        if cmd == OPEN:
            service = data.rstrip(b'\0').decode()
            assert service.startswith('shell:')
            out, ok = run_shell(service[6:])
            remote_id += 1
            if not ok:
                conn.sendall(pack(CLSE, 0, a0)); continue
            conn.sendall(pack(OKAY, remote_id, a0))
            conn.sendall(pack(WRTE, remote_id, a0, out.encode()))
            m2 = read_msg(f); assert m2 and m2[0] == OKAY, 'expected OKAY for WRTE'
            conn.sendall(pack(CLSE, remote_id, a0))
            m3 = read_msg(f); assert m3 and m3[0] == CLSE, 'expected CLSE from client'
        elif cmd == CLSE:
            pass

def main():
    port = int(sys.argv[1]); auto_accept = sys.argv[2] == 'accept'; expected_conns = int(sys.argv[3])
    s = socket.socket(); s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1); s.bind(('127.0.0.1', port)); s.listen(5)
    print('fake adbd listening', port, flush=True)
    for _ in range(expected_conns):
        c, _ = s.accept()
        try: handle(c, auto_accept)
        except Exception as e: LOG.append('error ' + repr(e))
        finally: c.close()
    print('\n'.join(LOG), flush=True)

if __name__ == '__main__': main()
