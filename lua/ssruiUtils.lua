#!/usr/bin/env lua

local io     = require('io')
local string = require('string')
local os     = require('os')
local string = require('string')

local module = {}

local function __quick_hash(c, p, s) --<
    return (c * (p % 0x10000) * s + c + s + p % 0x10000) % 0x100
end -->
local hex_string="0123456789ABCDEF"
local function __eight_bit_to_hex(num) --<
    assert(type(num) == "number")
    local i = num % 0x10 + 1
    local j = math.floor(num / 0x10) + 1
    return hex_string:sub(j, j) .. hex_string:sub(i, i)
end -->

function quick_hash(str) --<
    assert(type(str) == "string")
    local init = {
        210, 172, 214, 233, 194, 187, 154, 106,
        9,   11,  61,  3,   91,  142, 159, 26
    }
    local state = 4903
    local p = 1
    local p1, p2, p3, p4
    local ccode
    while (p<=str:len()) do
        ccode = string.byte(str, p)
        p1 = ((ccode % 7  ) * state + p) % 0x10 + 1
        p2 = ((ccode % 41 ) * state + p) % 0x10 + 1
        p3 = ((ccode % 101) * state + p) % 0x10 + 1
        p4 = ((ccode % 139) * state + p) % 0x10 + 1
        init[p1] = __quick_hash(init[p1], p, p1)
        init[p2] = __quick_hash(init[p2], p, p2)
        init[p3] = __quick_hash(init[p3], p, p3)
        init[p4] = __quick_hash(init[p4], p, p4)
        state = (state * ccode + p) % (0x10000)
        p = p + 1
    end
    local res = ""
    p = 1
    while (p <= 0x10) do
        res = res .. __eight_bit_to_hex(init[p])
        p = p + 1
    end
    return res
end -->
module.quick_hash = quick_hash

local function test_hash(str) --<
    print("quick hash: " .. str .. " => " .. quick_hash(str))
end -->
function main()
    test_hash("")
    test_hash("hello")
    test_hash("hello world!")
    test_hash("hello lua!")
    test_hash("https://github.com/")
end

if pcall(debug.getlocal, 4, 1) then
    -- packaged
    return module
else
    -- main
    main()
end
