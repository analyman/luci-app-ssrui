#!/usr/bin/env lua

local io     = require('io')
local string = require('string')
local os     = require('os')
local string = require('string')

local module = {}

local hex_string = "0123456789ABCDEF"
local function __eight_bit_to_hex(num) --<
    assert(type(num) == "number")
    local i = num % 0x10 + 1
    local j = math.floor(num / 0x10) + 1
    return hex_string:sub(j, j) .. hex_string:sub(i, i)
end -->

function __hex_num_check(c) --<
    assert(type(c) == "string" and c:len() == 1)
    c = c:upper()
    local n = string.byte(c, 1)
    assert((n <= string.byte("9", 1) and n >= string.byte("0", 1)) or (n <= string.byte("F", 1) and n >= string.byte("A", 1)))
end -->

function __hex_to_num(h1, h2) --<
    assert(type(h1) == "string" and h1:len() == 1)
    assert(type(h2) == "string" and h2:len() == 1)
    h1 = h1:upper()
    h2 = h2:upper()
    local n1 = h1:byte(1)
    local n2 = h2:byte(1)
    local mf = function(n)
        if n < string.byte("A", 1) then
            assert(n >= string.byte("0", 1))
            return n - string.byte("0", 1)
        else
            return n - string.byte("A", 1) + 10
        end
    end
    n1 = mf(n1)
    n2 = mf(n2)
    return n1 * 16 + n2
end -->

function __get_char_unescape() --<
    local remain = ""
    return function (cc)
        if cc == nil then 
            assert(remain == "") 
            return nil
        end
        local res
        assert(type(cc) == "string" and cc:len() == 1)
        if     remain:len() == 0 then
            if cc == "%" then
                remain = "%"
                return ""
            else
                return cc
            end
        elseif remain:len() == 1 then
            __hex_num_check(cc)
            remain = "%" .. cc
            return ""
        elseif remain:len() == 2 then
            __hex_num_check(cc)
            res = string.char(__hex_to_num(remain:sub(2,2), cc))
            remain = ""
            return res
        else
            error("debug here")
        end
    end
end -->

local char_that_should_be_escape = " #$%&@`/:;<=>?[\]^{|}~\"+'"
local check__ = {}
while (true) do
    local __i = 1
    while (__i <= char_that_should_be_escape:len()) do
        check__[char_that_should_be_escape:sub(__i, __i)] = true
        __i = __i + 1
    end
    break
end
function char_escape(cc) --<
    assert(type(cc) == "string" and cc:len() == 1)
    if check__[cc] then
        return "%" .. __eight_bit_to_hex(string.byte(cc, 1))
    else
        return cc
    end
end -->

function get_string_unescape_filter() --<
    local ff = __get_char_unescape()
    return function (chunk)
        if chunk == nil then
            return ff(nil)
        end
        local res = ""
        local i = 1
        while (i <= chunk:len()) do
            res = res .. ff(chunk:sub(i, i))
            i = i + 1
        end
        return res
    end
end -->
module.get_string_unescape_filter = get_string_unescape_filter

function string_escape_filter(chunk) --<
    if chunk == nil then return nil end
    local res = ""
    local i = 1
    while (i <= chunk:len()) do
        res = res .. char_escape(chunk:sub(i, i))
        i = i + 1
    end
    return res
end -->
module.string_escape_filter = string_escape_filter

function url_unescape(str) --<
    local filter = get_string_unescape_filter()
    local res = filter(str)
    res = res .. (filter(nil) or "")
    return res
end -->
module.unescape = url_unescape

function url_escape(str) --<
    local filter = string_escape_filter
    local res = filter(str)
    res = res .. (filter(nil) or "")
    return res
end -->
module.escape = url_escape

function main()
    local ff
    if arg[1] == "-d" then
        ff = url_unescape
    else
        ff = url_escape
    end
    local ret = ff(io.stdin:read("*a"))
    io.write(ret)
end

if pcall(debug.getlocal, 4, 1) then
    return module
else
    main()
end
