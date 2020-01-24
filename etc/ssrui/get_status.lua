#!/usr/bin/env lua

local jsonc = require('luci.jsonc')
local io    = require('io')
local os    = require('os')
local uci   = require('luci.model.uci')

local module = {}

local json_file = "/etc/ssrui/shadowsocksr.json"
function module.get_status()
    local fd = io.open(json_file, "r")
    local data = jsonc.parse(fd:read("*a"))
    if(data == nil) then
        return ""
    end
    local result = ""
    result = result .. "    Server Name:  " .. (data.remarks or "") .. "\n"
    result = result .. "    Bind Address: " .. (data.local_address or "") .. "\n"
    result = result .. "    Bind Port:    " .. (data.local_port or "" ) .. "\n"
    return result
end

function main()
    io.write(module.get_status())
end

if pcall(debug.getlocal, 4, 1) then
-- in package
    return module
else
-- in main script
    main(arg)
end
