#!/usr/bin/env python3
"""
Generate PNG icon files for the Productivity Tamagotchi extension.
No external dependencies — uses only built-in struct and zlib.
"""
import struct
import zlib
import os

# ─── Colour palette (RGBA) ────────────────────────────────────────────────────

T  = (0,   0,   0,   0)    # transparent
S  = (223, 230, 233, 255)  # egg shell  #DFE6E9
SD = (178, 190, 195, 255)  # shell dark #B2BEC3
EY = (45,  52,  54,  255)  # eye dark   #2D3436
PK = (253, 121, 168, 255)  # cheek pink #FD79A8
BG = (26,  26,  46,  255)  # bg navy    #1A1A2E

# ─── 16×16 sprite definition ─────────────────────────────────────────────────
#
#  Egg shape with eyes and blush cheeks.
#  Each row: (col_start, col_end_exclusive) of the egg body.
#
EGG_ROWS = {
    1:  (5, 11),
    2:  (4, 12),
    3:  (3, 13),
    4:  (3, 13),
    5:  (2, 14),
    6:  (2, 14),
    7:  (2, 14),   # ← eyes row
    8:  (2, 14),
    9:  (2, 14),   # ← cheeks row
    10: (3, 13),
    11: (3, 13),
    12: (4, 12),
    13: (5, 11),
}

EYES   = {(7, 5), (7, 10)}   # (row, col)
CHEEKS = {(9, 4), (9, 11)}


def pixel(row, col):
    if row not in EGG_ROWS:
        return BG
    lo, hi = EGG_ROWS[row]
    if col < lo or col >= hi:
        return BG
    if (row, col) in EYES:
        return EY
    if (row, col) in CHEEKS:
        return PK
    # Slight shadow on the left edge of the egg
    if col == lo:
        return SD
    return S


# Build flat 16×16 RGBA pixel list
BASE = [pixel(r, c) for r in range(16) for c in range(16)]


# ─── PNG writer ───────────────────────────────────────────────────────────────

def _chunk(tag: bytes, data: bytes) -> bytes:
    payload = tag + data
    crc = struct.pack('>I', zlib.crc32(payload) & 0xFFFFFFFF)
    return struct.pack('>I', len(data)) + payload + crc


def write_png(path: str, pixels: list, width: int, height: int) -> None:
    ihdr_data = struct.pack('>II', width, height) + bytes([8, 6, 0, 0, 0])
    ihdr = _chunk(b'IHDR', ihdr_data)

    raw = bytearray()
    for r in range(height):
        raw += b'\x00'  # filter type: None
        for c in range(width):
            raw += bytes(pixels[r * width + c])

    idat = _chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    iend = _chunk(b'IEND', b'')

    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n' + ihdr + idat + iend)


# ─── Nearest-neighbour upscale ────────────────────────────────────────────────

def upscale(pixels: list, src: int, scale: int) -> tuple:
    dst = src * scale
    result = []
    for r in range(src):
        row = []
        for c in range(src):
            row += [pixels[r * src + c]] * scale
        result += row * scale
    return result, dst


# ─── Generate ─────────────────────────────────────────────────────────────────

os.makedirs('icons', exist_ok=True)

write_png('icons/icon16.png',  BASE, 16, 16)

p48,  s48  = upscale(BASE, 16, 3)
write_png('icons/icon48.png',  p48,  s48,  s48)

p128, s128 = upscale(BASE, 16, 8)
write_png('icons/icon128.png', p128, s128, s128)

print('✓ icons/icon16.png   (16×16)')
print('✓ icons/icon48.png   (48×48)')
print('✓ icons/icon128.png  (128×128)')
