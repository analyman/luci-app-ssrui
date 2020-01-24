#!/usr/bin/env lua

local jsonc = require('luci.jsonc')
local io    = require('io')
local os    = require('os')
local uci   = require('luci.model.uci')

local module = {}

local json_file = "/etc/ssrui/shadowsocksr.json"
function module.update_json_file()
    local cc = uci:get_all("ssrui", "main_server")
    local json = jsonc.stringify(cc, true)
    if json == nil then
        return false
    end
    os.remove(json_file)
    local jj = io.open(json_file, "w")
    jj:write(json)
    jj:close()
    return true
end

function main()
    module.update_json_file()
end

if pcall(debug.getlocal, 4, 1) then
-- in package
    return module
else
-- in main script
    main(arg)
end
