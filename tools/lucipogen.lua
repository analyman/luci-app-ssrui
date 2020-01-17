#!/usr/bin/env lua

local io     = require('io')
local os     = require('os')
local string = require('string')
local table  = require('table')
local base   = _G

-----------------------------------------------------------------------------
-----------------------------------------------------------------------------
-- COPY FROM ltn12.lua

filter = {}
source = {}
sink = {}
pump = {}

-- 2048 seems to be better in windows...
BLOCKSIZE = 2048

-----------------------------------------------------------------------------
-- Filter stuff
-----------------------------------------------------------------------------


-- by passing it each chunk and updating a context between calls. 
function filter.cycle(low, ctx, extra)
    base.assert(low)
    return function(chunk)
        local ret
        ret, ctx = low(ctx, chunk, extra)
        return ret
    end
end

-- (thanks to Wim Couwenberg)
function filter.chain(...)
    local n = table.getn(arg)
    local top, index = 1, 1
    local retry = ""
    return function(chunk)
        retry = chunk and retry
        while true do
            if index == top then
                chunk = arg[index](chunk)
                if chunk == "" or top == n then return chunk
                elseif chunk then index = index + 1
                else
                    top = top+1
                    index = top
                end
            else
                chunk = arg[index](chunk or "")
                if chunk == "" then
                    index = index - 1
                    chunk = retry
                elseif chunk then
                    if index == n then return chunk
                    else index = index + 1 end
                else base.error("filter returned inappropriate nil") end
            end
        end
    end
end

-----------------------------------------------------------------------------
-- Source stuff
-----------------------------------------------------------------------------


-- create an empty source
local function empty()
    return nil
end

function source.empty()
    return empty
end

function source.error(err)
    return function()
        return nil, err
    end
end

function source.file(handle, io_err)
    if handle then
        return function()
            local chunk = handle:read(BLOCKSIZE)
            if chunk and chunk:len() == 0 then chunk = nil end
            if not chunk then handle:close() end
            return chunk
        end
    else return source.error(io_err or "unable to open file") end
end

function source.simplify(src)
    base.assert(src)
    return function()
        local chunk, err_or_new = src()
        src = err_or_new or src
        if not chunk then return nil, err_or_new
        else return chunk end
    end
end

function source.string(s)
    if s then
        local i = 1
        return function()
            local chunk = string.sub(s, i, i+BLOCKSIZE-1)
            i = i + BLOCKSIZE
            if chunk ~= "" then return chunk
            else return nil end
        end
    else return source.empty() end
end

function source.rewind(src)
    base.assert(src)
    local t = {}
    return function(chunk)
        if not chunk then
            chunk = table.remove(t)
            if not chunk then return src()
            else return chunk end
        else
            t[#t+1] = chunk
        end
    end
end

function source.chain(src, f)
    base.assert(src and f)
    local last_in, last_out = "", ""
    local state = "feeding"
    local err
    return function()
        if not last_out then
            base.error('source is empty!', 2)
        end
        while true do
            if state == "feeding" then
                last_in, err = src()
                if err then return nil, err end
                last_out = f(last_in)
                if not last_out then
                    if last_in then
                        base.error('filter returned inappropriate nil')
                    else
                        return nil
                    end
                elseif last_out ~= "" then
                    state = "eating"
                    if last_in then last_in = "" end
                    return last_out
                end
            else
                last_out = f(last_in)
                if last_out == "" then
                    if last_in == "" then
                        state = "feeding"
                    else
                        base.error('filter returned ""')
                    end
                elseif not last_out then
                    if last_in then
                        base.error('filter returned inappropriate nil')
                    else
                        return nil
                    end
                else
                    return last_out
                end
            end
        end
    end
end

-- Sources will be used one after the other, as if they were concatenated
-- (thanks to Wim Couwenberg)
function source.cat(...)
    local src = table.remove(arg, 1)
    return function()
        while src do
            local chunk, err = src()
            if chunk then return chunk end
            if err then return nil, err end
            src = table.remove(arg, 1)
        end
    end
end

-----------------------------------------------------------------------------
-- Sink stuff
-----------------------------------------------------------------------------


function sink.table(t)
    t = t or {}
    local f = function(chunk, err)
        if chunk then t[#t+1] = chunk end
        return 1
    end
    return f, t
end

function sink.simplify(snk)
    base.assert(snk)
    return function(chunk, err)
        local ret, err_or_new = snk(chunk, err)
        if not ret then return nil, err_or_new end
        snk = err_or_new or snk
        return 1
    end
end

function sink.file(handle, io_err)
    if handle then
        return function(chunk, err)
            if not chunk then
                handle:close()
                return 1
            else return handle:write(chunk) end
        end
    else return sink.error(io_err or "unable to open file") end
end

-- creates a sink that discards data
local function null()
    return 1
end

function sink.null()
    return null
end

function sink.error(err)
    return function()
        return nil, err
    end
end

function sink.chain(f, snk)
    base.assert(f and snk)
    return function(chunk, err)
        if chunk ~= "" then
            local filtered = f(chunk)
            local done = chunk and ""
            while true do
                local ret, snkerr = snk(filtered, err)
                if not ret then return nil, snkerr end
                if filtered == done then return 1 end
                filtered = f(done)
            end
        else return 1 end
    end
end

-----------------------------------------------------------------------------
-- Pump stuff
-----------------------------------------------------------------------------


function pump.step(src, snk)
    local chunk, src_err = src()
    local ret, snk_err = snk(chunk, src_err)
    if chunk and ret then return 1
    else return nil, src_err or snk_err end
end

function pump.all(src, snk, step)
    base.assert(src and snk)
    step = step or pump.step
    while true do
        local ret, err = step(src, snk)
        if not ret then
            if err then return nil, err
            else return 1 end
        end
    end
end

-----------------------------------------------------------------------------
-----------------------------------------------------------------------------
--------------------------- END OF LTN12 COPY -------------------------------

local module = {}

-- by passing it each chunk and updating a context between calls.
--              <      <%     <%:*      *       <%:*%

function transition_function(state, char)
    assert(type(char)  == "string")
    assert(type(state) == "number")
    assert(string.len(char) == 1)
--    print("state: ", state, "char: ", char) -- DEBUG
    if(state == 1) then
        if(char == "%") then
            return 2, nil
        else
            return 4, nil
        end
    elseif(state == 2) then
        if(char == ":") then
            return 3, nil
        else
            return 4, nil
        end
    elseif(state == 3) then
        if(char == "%") then
            return 5, nil
        else
            return 3, char
        end
    elseif(state == 4) then
        if(char == "<") then
            return 1, nil
        else
            return 4, nil
        end
    elseif(state == 5) then
        if(char == ">") then
            return 4, string.char(0)
        else
            return 3, "%" .. char
        end
    else
        assert(0 == 1)
    end
end

function get_translate_func()
    local ctx = 4
    return function(chunk)
        if(chunk == "" ) then return "" end
        if(chunk == nil) then return nil end
        assert(type(chunk) == "string")
        local len = string.len(chunk)
        local i = 1
        local ret = ""
        while(i <= len) do
            ctx, c = transition_function(ctx, string.char(chunk:byte(i)))
            if c then ret = ret .. c end
            i = i + 1
        end
        return ret
    end
end

function get_string_table_sink(_table)
    local remain = ""
    _table = _table or {}
    return function(chunk)
        if chunk == nil then
            if remain ~= "" then
                _table[#_table + 1] = remain
                remain = ""
            end
            return nil
        end
        local start_search = 1
        local pos = string.find(chunk, string.char(0), start_search, true)
        while pos do
            if start_search == pos then 
                start_search = start_search + 1
                if remain ~= "" then
                    _table[#_table + 1] = remain
                    remain = ""
                end
            else
                remain = remain .. string.sub(chunk, start_search, pos - 1)
                if remain ~= "" then
                    _table[#_table + 1] = remain
                    remain = ""
                end
                start_search = pos + 1
            end
            if(start_search <= string.len(chunk)) then
                pos = string.find(chunk, string.char(0), start_search, true)
            else
                pos = nil
            end
        end
        if(start_search <= string.len(chunk)) then
            remain = remain .. string.sub(chunk, start_search)
        end
        return 1
    end
end

function get_string_table(file)
    local fh = io.open(file, "r")
    if(not fh) then
        error("can open file '" .. file .. "'")
        return nil
    end
    local src = source.file(fh)
    local csrc = source.chain(src, get_translate_func())
    local tt = {}
    pump.all(csrc, get_string_table_sink(tt))
    return tt
end

-- 12 2 30 4 0 5 0 don't support escape character
-- <% * %> " " ' '
function fetch_lua_code(state, char)
    assert(type(char)  == "string")
    assert(type(state) == "number")
    assert(string.len(char) == 1)
    if(state == 0) then
        if(char == "<") then return 1, nil else return 0, nil end
    elseif (state == 1) then
        if(char == "%") then return 2, nil else return 0, nil end
    elseif (state == 2) then
        if(char == "\"") then return 4, char
        elseif(char == "'") then return 5, char
        elseif(char == "%") then return 3, nil
        else return 2, char end
    elseif(state == 3) then
        if(char == ">") then return 0, " " -- space
        else return 2, "%" .. char end
    elseif(state == 4) then
        if(char == "\"") then return 2, char
        else return 4, char end
    elseif(state == 5) then
        if(char == "'") then return 2, char
        else return 5, char end
    end
end

function get_fetch_lua_code()
    local ctx = 0
    return function(chunk)
        if(chunk == "" ) then return "" end
        if(chunk == nil) then return nil end
        assert(type(chunk) == "string")
        local len = string.len(chunk)
        local i = 1
        local ret = ""
        while(i <= len) do
            ctx, c = fetch_lua_code(ctx, string.char(chunk:byte(i)))
            if c then ret = ret .. c end
            i = i + 1
        end
        return ret
    end
end

function print_trans_table(tt)
    for i, j in next, tt do
        print("trans(", i:byte(1), ", \"", i:byte(2), "\") = ", j[1], ", ", j[2])
    end
end

function fetch_function_pure_string_arg(func_name)
    assert(type(func_name) == "string")
    trans_table = {}

    trans_table[string.char(4) .. " "] = {4, nil}
    trans_table[string.char(4) .. "\t"] = {4, nil}
    trans_table[string.char(4) .. "\n"] = {4, nil}
    trans_table[string.char(4) .. "\r"] = {4, nil}

    trans_table[string.char(5) .. " "] = {5, nil}
    trans_table[string.char(5) .. "\t"] = {5, nil}
    trans_table[string.char(5) .. "\n"] = {5, nil}
    trans_table[string.char(5) .. "\r"] = {5, nil}

    trans_table[string.char(6) .. " "] = {6, nil}
    trans_table[string.char(6) .. "\t"] = {6, nil}
    trans_table[string.char(6) .. "\n"] = {6, nil}
    trans_table[string.char(6) .. "\r"] = {6, nil}

    trans_table[string.char(6) .. "\""] = {1, "\""}
    trans_table[string.char(6) .. "'"] = {2, "'" }

    trans_table[string.char(1) .. "\""] = {4, "\""} --
    trans_table[string.char(2) .. "'" ] = {5, "'" } --

    trans_table[string.char(4) .. ")"] = {0, string.char(0)}
    trans_table[string.char(5) .. ")"] = {0, string.char(0)}

    trans_table[string.char(4) .. ","] = {6, string.char(1)}
    trans_table[string.char(5) .. ","] = {6, string.char(1)}

    local len = func_name:len()
    local index = 2
    while(index <= len) do
        trans_table[string.char(index + 8) .. string.char(string.byte(func_name, index))] = {index + 9, nil}
        index = index + 1
    end
    trans_table[string.char(0) .. string.char(string.byte(func_name, 1))] = {10, nil}
    trans_table[string.char(len + 9) .. " "] = {len + 8, nil}
    trans_table[string.char(len + 9) .. "("] = {6,       nil}
--    print_trans_table(trans_table) -- DEBUG
    return function(state, char)
        assert(type(char)  == "string")
        assert(type(state) == "number")
        assert(string.len(char) == 1)
        local res = trans_table[string.char(state) .. char]
        if res then
--            print("state: ", state, "char: ", char, "return: ", res[1]) -- DEBUG
            return res[1], res[2]
        end
        if state == 1 then return 1, char end
        if state == 2 then return 2, char end
        return 0, nil
    end
end

function get_trans_fetch()
    local ctx = 0
    local func = fetch_function_pure_string_arg("translate")
    return function(chunk)
        if(chunk == "" ) then return "" end
        if(chunk == nil) then return nil end
        assert(type(chunk) == "string")
        local len = string.len(chunk)
        local i = 1
        local ret = ""
        while(i <= len) do
            ctx, c = func(ctx, string.char(chunk:byte(i)))
--            print("state: ", ctx, "char: ", c) -- DEBUG
            if c then ret = ret .. c end
            i = i + 1
        end
        return ret
    end
end

function get_string_table_2(file)
    local fh = io.open(file, "r")
    if(not fh) then
        error("can open file '" .. file .. "'")
        return nil
    end
    local src = source.file(fh)
    local filter = filter.chain(get_fetch_lua_code(), get_trans_fetch())
    local csrc = source.chain(src, filter)
    local tt = {}
    pump.all(csrc, get_string_table_sink(tt))
    return tt
end

function string_to_po_msg(str)
    if     (str:byte(1) == string.byte("\"", 1) and str:byte(str:len()) == string.byte("\"", 1)) 
        or (str:byte(1) == string.byte("'",  1) and str:byte(str:len()) == string.byte("'",  1)) then
        return "msgid " .. str .. "\nmsgstr \"\"\n\n"
    else
        return "msgid \"" .. str .. "\"\nmsgstr \"\"\n\n"
    end
end

function remove_duplicate_value(table_)
    local hash = {}
    local res = {}

    for _,v in ipairs(table_) do
        if (not hash[v]) then
            res[#res+1] = v
            hash[v] = true
        end
    end
    return res
end

function module.getPoFile(input, ouput)
    local ofd
    if output ~= nil then
        ofd = io.open(output, "a")
        if not ofd then error("can't open file '" .. output .. "' to append") end
    else
        ofd = io.stdout
    end
    local t1 = get_string_table  (input)
    local t2 = get_string_table_2(input)
    for _, v in ipairs(t2) do
        table.insert(t1, v:sub(2, -2))
    end
    table.sort(t1)
    for _, v in ipairs(remove_duplicate_value(t1)) do
        ofd:write(string_to_po_msg(v))
    end
end
module.getStringTableColon = get_string_table
module.getStringTableTrans = get_string_table_2

function usage()
    io.write(
    "Usage: lucipogen.lua <input> [<output>]\n" ..
    "       \n" ..
    "       if the output file is omited, then using standard output\n"
    )
end

function main(args)
    if table.getn(args) > 2 or table.getn(args) == 0 then
        usage()
        os.exit(1)
    end
    module.getPoFile(args[1], args[2])
    os.exit(0)
end

if pcall(debug.getlocal, 4, 1) then
-- in package
    return module
else
-- in main script
    main(arg)
end
