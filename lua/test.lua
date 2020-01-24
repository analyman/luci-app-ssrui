#!/usr/bin/env lua

local bb = require("base64")

local cc = "asdf-_ff"
local mm = bb.safe_decode(cc)
local zz = bb.encode(mm)

print(cc)
print()
print(mm)
print()
print(zz)
