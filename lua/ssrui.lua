local io     = require('io')
local string = require('string')
local os     = require('os')
local nfs    = require('nixio.fs')
local string = require('string')

local json = require('luci.jsonc')

local utils = require('ssruiUtils')
local url   = require('urlescape')

local upload = require('uploadfile')

local log = require('log')
log.outfile = "/var/run/ssrui_luci.log"

local img_dir     = "/www/luci-static/resources/ssrui/img/bli"
local himg_dir    = string.sub(img_dir, 5, string.len(img_dir))
local js_path_var = "img_dir"
local js_imgs_var = "roll_imgs"

local module = {}

function module.map(table, func) --<
    local ret = {}
    if type(table) ~= "table" or type(func) ~= "function" then
        return nil
    end
    for i, j in next, table do
        ret[i] = func(j)
    end
    return ret
end -->

function module.filter(table, func) --<
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
end -->

function module.imap(array, func) --<
    local ret = {}
    if type(table) ~= "table" or type(func) ~= "function" then
        return nil
    end
    for i in ipairs(array) do
        ret[i] = func(array[i])
    end
    return ret
end -->

function module.ifilter(array, func) --<
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
end -->

local function file_exist(file) --<
    if nfs.stat(file, "type") == nil then
        return false
    else
        return true
    end
end -->

local __valid_suffix = {"jpg", "png", "jpeg"}
local function valid_suffix(file) --<
    if type(file) ~= "string" then
        return false
    end
    for i in ipairs(__valid_suffix) do
        if (string.match(file, "^.*%." .. __valid_suffix[i] .. "$")) then
            return true
        end
    end
    return false
end -->

function module.get_img() --<
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
end -->

function module.to_js_code() --<
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
end -->

function module.test_ssr_server(server, port) --<
    local stat = os.execute("/usr/bin/test_server.sh " .. server .. " " .. port .. " 1>/tmp/tout.txt 2>&1")
    local out  = io.open("/tmp/tout.txt", "r")
    local res  = out:read("*a")
    os.remove("/tmp/tout.txt")
    return res
end -->

function module.fhash(str) --<
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
end -->

local gfw_dir   = "/etc/ssrui/gfw/"
local gfw_index = "/etc/ssrui/gfw_list.json" -- JSON
--[
-- {
--    #hash: {
--      url:  #url,
--      name: #name
--    }, ...
-- }
--]
module.gfw_dir   = gfw_dir
module.gfw_index = gfw_index

function  read_gfw_index() --< => table
    if nfs.stat(gfw_index, "type") ~= "reg" then return nil end
    if upload.acquire_file_lock(gfw_index) ~= true then return nil end
    local data = nfs.readfile(gfw_index)
    if data == nil then return nil end
    if data == "" then data = "{}" end
    local res = json.parse(data)
    upload.release_file_lock(gfw_index)
    return res
end -->
module.read_gfw = read_gfw_index
function write_gfw_index(json_data) --< => boolean | nil
    assert(type(json_data) == "table")
    if nfs.stat(gfw_index, "type") ~= "reg" then return nil end
    local data = json.stringify(json_data)
    if upload.acquire_file_lock(gfw_index) ~= true then return nil end
    local res = nfs.writefile(gfw_index, data)
    upload.release_file_lock(gfw_index)
    return res
end -->
-- params: opcode, url_hash, name
-- opcode 1: get all of the gfw list information in server
-- opcode 2: get gfw list information specified by url hash [url_hash]
-- opcode 3: delete a item which is specified by url hash
-- opcode 4: post new item, which need url_hash, name and the posted data
function handle_request_gfw() --<
    if luci.http.context.request == nil then
        log.error("server error, request is nil")
        luci.http.status(500, "Internal Server Error")
        return false
    end
    local opcode = tonumber(luci.http.formvalue("opcode"))

    if     opcode == 1 then
        local all_json = read_gfw_index()
        if all_json == nil then
            luci.http.status(500, "Internal Server Error")
            return false
        end
        for hash, url_and_name in next, all_json do
            local data = nfs.readfile(upload.concat_path(gfw_dir, hash))
            url_and_name["data"] = data
        end
        luci.http.status(200, "OK")
        luci.http.write(json.stringify(all_json))
        return true
    elseif opcode == 2 then
        local all_json = read_gfw_index()
        if all_json == nil then
            luci.http.status(500, "Internal Server Error")
            return false
        end
        local hash = luci.http.formvalue("hash")
        if hash == nil or all_json[hash] == nil then
            luci.http.status(400, "Bad Request")
            return false
        end
        luci.http.status(200, "OK")
        luci.http.write(nfs.readfile(upload.concat_path(gfw_dir, hash)) or "")
        return true
    elseif opcode == 3 then
        local all_json = read_gfw_index()
        if all_json == nil then
            luci.http.status(500, "Internal Server Error")
            return false
        end
        local hash = luci.http.formvalue("hash")
        if hash == nil then
            luci.http.status(400, "Bad Request")
            return false
        end
        if all_json[hash] == nil then
            luci.http.status(200, "OK")
            return true
        end
        nfs.remove(upload.concat_path(gfw_dir, hash))
        all_json[hash] = nil
        write_gfw_index(all_json)
        luci.http.context.status(200, "OK")
        return false
    elseif opcode == 4 then
        luci.http.status(403, "Forbidden")
        return true
    else
        luci.http.status(400, "Bad Request")
        return false
    end
end -->
module.handle_request_gfw = handle_request_gfw

function copyfile_handle() --<
    local req_method = luci.http.getenv("REQUEST_METHOD")
    if req_method:lower() ~= "post" then
        luci.http.status(400, "Bad Request")
        return 1
    end
    local content, len = luci.http.content()
    local tb = json.parse(content)
    if len == 0 or tb == nil or tb["hash"] == nil or tb["name"] == nil or tb["url"] == nil then 
        luci.http.status(406, "Not Acceptable")
        return 1
    end
    local all_json = read_gfw_index()
    local src_file = upload.concat_path(upload.tmp_file_dir, tb["hash"], "file")
    local dst_file = upload.concat_path(gfw_dir, tb["hash"])
    nfs.mkdirr(nfs.dirname(dst_file))
    if nfs.stat(nfs.dirname(dst_file), "type") ~= "dir" or all_json == nil then
        luci.http.status(500, "Internal Server Error")
        luci.http.write(json.stringify({x1 = nfs.stat(nfs.dirname(dst_file), "type") ~= "dir", x2 = all_json == nil}))
        return 1
    end
    if nfs.copy(src_file, dst_file) == nil then
        luci.http.status(404, "Not Found")
        return 1
    end
    all_json[tb["hash"]] = {url = tb["url"], name = tb["name"]}
    write_gfw_index(all_json)
    luci.http.status(200, "OK")
    return 0
end -->
module.copyfile_handle = copyfile_handle

function delfile_handle() --<
    local req_method = luci.http.getenv("REQUEST_METHOD")
    if req_method:lower() ~= "post" then
        luci.http.status(400, "Bad Request")
        return 1
    end
    local content, len = luci.http.content()
    local tb = json.parse(content)
    if len == 0 or tb == nil or tb["hash"] == nil then 
        luci.http.status(406, "Not Acceptable")
        return 1
    end
    local dir = upload.concat_path(upload.tmp_file_dir, tb["hash"])
    os.execute("rm -rf " .. dir)
    luci.http.status(200, "OK")
    return 0
end -->
module.delfile_handle = delfile_handle

local user_defined_gfw_url = "/cgi-bin/luci/admin/services/ssrui/user-defined-gfw"
function user_defined_gfw() --<
    luci.http.status(200, "OK")
    luci.http.write(nfs.readfile(upload.concat_path(gfw_dir, utils.quick_hash(user_defined_gfw_url))))
    return true
end -->
module.user_defined_gfw = user_defined_gfw

function main()
    print("main doesn't implement")
end

if pcall(debug.getlocal, 4, 1) then
    return module
else
    main()
end
