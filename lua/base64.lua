#!/usr/bin/env lua

-- lua implementation of base64

local math   = require('math')
local string = require('string')
local table  = require('table')

local module = {}

local option_62_63 = {
    {'+', '/'},
    {'-', '_'},
    {'+', ','},
    {'.', '_'},
    {'_', '-'},
    {'~', '-'}
}

local padding    = true
local base_62_63 = option_62_63[1]

-- @param _table_ 
--                padding: boolean
--                c62_63 : {string, string}
function set_options(_table_)
    if _table_.padding then 
        assert(type(_table_.padding) == "boolean")
        padding = _table_.padding 
    end
    if _table_.c62_63  then
        assert(type(_table_.padding) == "table")
        assert(#_table_ == 2)
        local i = 1
        local assert_false = false
        while (i <= #option_62_63) do
            if _table.c62_63[1] == option_62_63[i][1] and
               _table.c62_63[2] == option_62_63[i][2] then
               padding = option_62_63[i]
               assert_false = true
           end
        end
        if not assert_false then
            error("invalid option")
        end
    end
end

function get_options(opt)
    if opt == nil then
        return {padding = padding, c62_63 = base_62_63}
    else
        assert(type(opt) == "string")
        if opt == "padding" then
            return padding
        elseif opt == "c6263" then
            return base_62_63
        else
            assert(false)
        end
    end
end

function char_map(val)
    if val == nil then return nil end
    assert(type(val) == "number")
    assert(val <= 63)
    local ret = ""
    if      val <= 25 then
        ret = string.char(val + string.byte("A", 1) - 0 )
    elseif val <= 51 then
        ret = string.char(val + string.byte("a", 1) - 26)
    elseif val <= 61 then
        ret = string.char(val + string.byte("0", 1) - 52)
    elseif val == 62 then
        ret = base_62_63[1]
    else
        ret = base_62_63[2]
    end
    return ret
end

function transition_table_3to4(a, b, c)
    assert(type(a) == "string" and type(b) == "string" and type(c) == "string")
    assert(a:len() == 1 and b:len() == 1 and c:len() == 1)
    local i1 = math.floor(a:byte(1) / 2^2)
    local i2 = math.floor(((a:byte(1) * (2^6)) % 256) / 2^2) + math.floor(b:byte(1) / 2^4)
    local i3 = math.floor(((b:byte(1) * 2 ^ 4) % 256) / 2^2) + math.floor(c:byte(1) / 2^6)
    local i4 = c:byte(1) % 2^6
    return char_map(i1), char_map(i2), char_map(i3), char_map(i4)
end

function to_base64_3to4(a, b, c)
    assert(a ~= nil)
    local padding = 0
    if c == nil then 
        padding = 1 
        c = string.char(0)
    end
    if b == nil then 
        padding = 2 
        b = string.char(0)
    end
    local i1, i2, i3, i4 = transition_table_3to4(a, b, c)
    if padding >= 1 then
        if padding then i4 = "=" else i4 = "" end
    end
    if padding >= 2 then
        if padding then i3 = "=" else i3 = "" end
    end
    return i1 .. i2 .. i3 .. i4
end

function to_base64_3to4_str(a)
    assert(a:len() <= 3 and a:len() >= 1)
    return to_base64_3to4(a:sub(1, 1), a:sub(2, 2), a:sub(3, 3))
end

function reverse_char_map(a)
    assert(type(a) == "string")
    assert(a:len() == 1)
    local val = a:byte(1)
    if      val >= string.byte("A", 1) and val <= string.byte("Z", 1) then
        return val - string.byte("A", 1) + 0
    elseif val >= string.byte("a", 1) and val <= string.byte("z", 1) then
        return val - string.byte("a", 1) + 26
    elseif val >= string.byte("0", 1) and val <= string.byte("9", 1) then
        return val - string.byte("0", 1) + 52
    end
    if val == string.byte("=", 1) then return 64 end -- padding
    assert(val == string.byte(base_62_63[1], 1) or val == string.byte(base_62_63[2], 1))
    if val == string.byte(base_62_63[1], 1) then
        return 62
    else
        return 63
    end
end

function reverse_transition_table_4to3(a, b, c, d)
    assert(type(a) == "number" and type(b) == "number" and type(c) == "number" and type(d) == "number")
    assert(a <= 63 and b <= 63 and c <= 64 and d <= 64)
    assert(a >=  0 and b >=  0 and c >=  0 and d >=  0)
    local cx = c
    local dx = d
    if c == 64 then cx = 0 end
    if d == 64 then dx = 0 end
    local c1 =  a  * 2^2        + math.floor(b / 2^4)
    local c2 = (b  * 2^4) % 256 + math.floor(cx / 2^2)
    local c3 = (cx * 2^6) % 256 + dx
    local cc1 = string.char(c1)
    local cc2 = string.char(c2)
    local cc3 = string.char(c3)
    if c == 64 then 
        return cc1, "", ""
    end
    if d == 64 then
        return cc1, cc2, ""
    end
    return cc1, cc2, cc3
end

function from_base64_4to3(a, b, c, d)
    local c1, c2, c3 = reverse_transition_table_4to3(
                       reverse_char_map(a), reverse_char_map(b),
                       reverse_char_map(c), reverse_char_map(d))
    return c1 .. c2 .. c3
end

function from_base64_3to4_str(str)
    assert(type(str) == "string" and str:len() == 4)
    return from_base64_4to3(str:sub(1,1), str:sub(2,2), str:sub(3,3), str:sub(4,4))
end

function get_base64_encode()
    local save_char  = {}
    local _finish_   = false
    return function (chunk)
        if _finish_ then return nil end
        if chunk == nil then 
            _finish_ = true
            if #save_char == 0 then return "" end
            if #save_char == 1 then return to_base64_3to4(save_char[1], nil, nil) end
            if #save_char == 2 then return to_base64_3to4(save_char[1], save_char[2], nil) end
        end
        assert(type(chunk) == "string")
        if chunk == ""  then return "" end
        local ret =""
        local i = 1
        if #save_char ~= 0 then
            if #save_char + chunk:len() < 3 then
                while (i<=chunk:len()) do
                    save_char[#save_char + 1] = string.char(chunk:byte(i))
                    i = i + 1
                end
                return ""
            else
                while (i<=chunk:len()) do
                    save_char[#save_char + 1] = string.char(chunk:byte(i))
                    i = i + 1
                    if #save_char == 3 then
                        ret = to_base64_3to4(save_char[1], save_char[2], save_char[3])
                        save_char = {}
                        break
                    end
                end
            end
        end
        while (i <= chunk:len() - 2) do
            local temp = to_base64_3to4_str(chunk:sub(i , i+2))
            ret = ret .. temp
            i = i + 3
        end
        while (i <= chunk:len()) do
            save_char[#save_char + 1] = chunk:sub(i, i)
            i = i + 1
        end
        return ret
    end
end
module.base64_encode_filter = get_base64_encode

function get_base64_decode(str)
    local save_char = {}
    return function (chunk)
        if chunk == nil then return nil end
        if chunk ==  "" then return "" end
        assert(type(chunk) == "string")
        local ret = ""
        local i = 1
        if #save_char ~= 0 then
            if #save_char + chunk:len() < 4 then
                while (i<=chunk:len()) do
                    save_char[#save_char + 1] = string.char(chunk:byte(i))
                    i = i + 1
                end
                return ""
            else
                while (i<=chunk:len()) do
                    save_char[#save_char + 1] = string.char(chunk:byte(i))
                    i = i + 1
                    if #save_char == 4 then
                        ret = from_base64_4to3(save_char[1], save_char[2], save_char[3], save_char[4])
                        save_char = {}
                        break
                    end
                end
            end
        end
        while (i <= chunk:len() - 3) do
            local temp = from_base64_3to4_str(chunk:sub(i , i+3))
            ret = ret .. temp
            i = i + 4
        end
        while (i <= chunk:len()) do
            save_char[#save_char + 1] = chunk:sub(i, i)
            i = i + 1
        end
        return ret
    end
end

function get_multiple_of_four_padding()
    local len = 0
    return function (chunk)
        if chunk == nil then
            local mod = len % 4
            assert(mod ~= 1)
            if mod == 0 then
                return nil
            elseif mod == 2 then
                return "="
            elseif mod == 3 then
                return "=="
            end
        end
        assert(type(chunk) == "string")
        len = len + chunk:len()
        return chunk
    end
end

function base64_encode(str)
    local filter = get_base64_encode()
    local ret    = filter(str)
    ret = ret .. filter(nil)
    return ret
end
module.encode = base64_encode

function chain_two(f1, f2)
    return function(chunk)
        return f2(f1(chunk))
    end
end

function get_base64_decode__()
    local f1 = get_multiple_of_four_padding()
    local f2 = get_base64_decode()
    local ff = chain_two(f1, f2)
    return ff
end
module.base64_decode_filter = get_base64_decode__

function base64_decode(str)
    local ff  = get_base64_decode__()
    local ret = ff(str)
    local ret = ret .. (ff(nil) or "")
    return ret
end
module.decode = base64_decode

function base64_safe_decode(str)
    local origin_6263 = base_62_63
    local i = 1
    while (i <= #option_62_63) do
        base_62_63 = option_62_63[i]
        local ret
        if pcall(function() ret = base64_decode(str) end) then
            base_62_63 = origin_6263
            return ret
        end
        i = i + 1
    end
    error("invalid encoded base64 string")
end
module.safe_decode = base64_safe_decode

function main()
    local ff
    if arg[1] == "-d" then
        ff = base64_decode
    else
        ff = base64_encode
    end
    local ret = ff(io.stdin:read("*a"))
    io.write(ret)
end

if pcall(debug.getlocal, 4, 1) then
    return module
else
    main()
end
