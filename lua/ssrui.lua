local io     = require('io')
local string = require('string')
local os     = require('os')
local nfs    = require('nixio.fs')
local string = require('string')

local img_dir     = "/www/luci-static/resources/ssrui/img/bli"
local himg_dir    = string.sub(img_dir, 5, string.len(img_dir))
local js_path_var = "img_dir"
local js_imgs_var = "roll_imgs"

local module = {}

function module.map(table, func)
    local ret = {}
    if type(table) ~= "table" or type(func) ~= "function" then
        return nil
    end
    for i, j in next, table do
        ret[i] = func(j)
    end
    return ret
end

function module.filter(table, func)
    local ret = {}
    if type(table) ~= "table" or type(func) ~= "function" then
        return nil
    end
    for i, j in next, table do
       if func(j) then
           ret[i] = j
       end
    end
    return ret
end

function module.imap(array, func)
    local ret = {}
    if type(table) ~= "table" or type(func) ~= "function" then
        return nil
    end
    for i in ipairs(array) do
        ret[i] = func(array[i])
    end
    return ret
end

function module.ifilter(array, func)
    local ret = {}
    if type(table) ~= "table" or type(func) ~= "function" then
        return nil
    end
    for i in ipairs(array) do
       if func(array[i]) then
           ret[#ret + 1] = array[i]
       end
    end
    return ret
end

local function file_exist(file)
    if nfs.stat(file, "type") == nil then
        return false
    else
        return true
    end
end

local __valid_suffix = {"jpg", "png", "jpeg"}
local function valid_suffix(file)
    if type(file) ~= "string" then
        return false
    end
    for i in ipairs(__valid_suffix) do
        if (string.match(file, "^.*%." .. __valid_suffix[i] .. "$")) then
            return true
        end
    end
    return false
end

function module.get_img()
    local ret_val = {}
    if nfs.stat(img_dir, "type") ~= "dir" then
        return ret_val
    end
    for i in nfs.dir(img_dir) do
        if valid_suffix(i) then
            ret_val[#ret_val + 1] = i
        end
    end
    return ret_val
end

function module.to_js_code()
    local ret_string = "var " .. js_path_var .. " = \"" .. himg_dir .. "\";\n" .. "var " .. js_imgs_var .. " = ["
    local imgs = module.get_img()
    for i in ipairs(imgs) do
        ret_string = ret_string .. "\"" .. imgs[i] .. "\","
    end
    if string.char(string.byte(ret_string, string.len(ret_string))) == "," then
        ret_string = string.sub(ret_string, 1, string.len(ret_string) - 1)
    end
    ret_string = ret_string .. "];"
    return "<script type=\"text/javascript\">\n" .. ret_string .. "</script>\n"
end

function module.test_ssr_server(server, port)
    local stat = os.execute("/usr/bin/test_server.sh " .. server .. " " .. port .. " 1>/tmp/tout.txt 2>&1")
    local out  = io.open("/tmp/tout.txt", "r")
    local res  = out:read("*a")
    os.remove("/tmp/tout.txt")
    return res
end

function module.fhash(str)
    assert(type(str) == "string")
    local hash = 0
    local ss
    local i = 1
    while (i<=str:len()) do
        ss = string.byte(str, i)
        hash = (hash * 32 - hash) % 2^32 + ss
        i = i + 1
    end
    return hash
end

function main()
    print("main doesn't implement")
end

if pcall(debug.getlocal, 4, 1) then
    return module
else
    main()
end