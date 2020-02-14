local io = require('io')
local os = require('os')
local string = require('string')
local table  = require('table')
local jsonc  = require('luci.jsonc')
local upload = require('uploadfile')

local ssrui = require('ssrui')
local nfs   = require('nixio.fs')

module("luci.controller.ssrui", package.seeall)
function index()
		if not nixio.fs.access("/etc/config/ssrui") then
		return
	end
	local page
	page = entry({"admin", "services", "ssrui"}, cbi("ssrui"), _("SSR LuCI Web UI"))
	page.dependent = true
	entry({"admin", "services", "ssrui", "status"},       call("act_status")).leaf=true
    entry({"admin", "services", "ssrui", "request-json"}, call("handle_request_json")).leaf=true
    entry({"admin", "services", "ssrui", "test-server"},  call("test_server")).leaf=true
    entry({"admin", "services", "ssrui", "gfw"},          call("gfw_handle")).leaf=true
    entry({"admin", "services", "ssrui", "uploadfile"},   call("uploadfile_handle")).leaf=true
    entry({"admin", "services", "ssrui", "copyfile"},     call("copyfile_handle")).leaf=true
    entry({"admin", "services", "ssrui", "delfile"},      call("delfile_handle")).leaf=true
end

function gfw_handle() --<
    return ssrui.handle_request_gfw()
end -->

function act_status() --<
  local e={}
  e.running=luci.sys.call("pgrep ssr-redir >/dev/null")==0
  luci.http.prepare_content("application/json")
  luci.http.write_json(e)
end -->

local __valid_json_files = {}
__valid_json_files["protocol_list"] = "/etc/ssrui/protocol_list.json"
__valid_json_files["method_list"]   = "/etc/ssrui/method_list.json"
__valid_json_files["obfs_list"]     = "/etc/ssrui/obfs_list.json"
__valid_json_files["server_list"]   = "/etc/ssrui/server_list.json"
function handle_request_json() --<
    local req_method = luci.http.getenv("REQUEST_METHOD")
    if req_method == nil then
        io.write("<h1> FUCK FAULT ERROR </h1>")
        return 1
    end
    if req_method:lower() == "post" then
        return handle_post_json()
    else
        return response_with_json()
    end
end -->

function response_with_json() --<
    if luci.http.context.request == nil then
        luci.http.status(500, "Internal Server Error")
        return 1
    end
    local http_msg = luci.http.context.request.message
    if http_msg == nil or http_msg.params == nil then 
        if http_msg == nil then
            luci.http.status(401, "FUCK")
        else
            luci.http.status(400, "Bad Request")
        end
        return 1
    end
    local what_json = http_msg.params["what"]
    if what_json == nil then
        luci.http.status(404, "Not Found")
        return 1
    end
    local write_back = __valid_json_files[what_json]
    if write_back == nil then
        luci.http.status(404, "Not Found")
        return 1
    end
    local fd = io.open(write_back, "r")
    if fd == nil then
        luci.http.status(404, "Not Found")
        return 1
    end
    luci.http.status(200, "OK")
    luci.http.prepare_content("application/json")
    luci.http.write(fd:read("*a"))
    fd:close()
end -->

function handle_post_json() --<
    if luci.http.context.request == nil then
        luci.http.status(500, "Internal Server Error")
        return 1
    end
    local http_msg = luci.http.context.request.message
    if http_msg == nil or http_msg.params == nil then 
        if http_msg == nil then
            luci.http.status(400, "FUCK")
        else
            luci.http.status(400, "Bad Request")
        end
        return 1
    end
    local what_json = http_msg.params["what"]
    if what_json == nil then
        luci.http.status(400, "Bad Request")
        return 1
    end
    if luci.http.getenv("CONTENT_TYPE") ~= "application/json" then
        luci.http.status(400, "Bad Request")
        return 1
    end
    local write_back = __valid_json_files[what_json]
    if write_back == nil then
        luci.http.status(404, "Not Found")
        return 1
    end
    local content, length = luci.http.content()
    if(length == 0) then
        luci.http.status(400, "Bad Request")
        return 1
    end
    os.remove(write_back)
    local fd = io.open(write_back, "w")
    fd:write(content)
    fd:close()
    luci.http.status(200, "OK")
    return 0
end -->

function test_server() --<
    if luci.http.context.request == nil then
        luci.http.status(500, "Internal Server Error")
        return 1
    end
    local content, len = luci.http.content()
    if content == nil or len == 0 then
        luci.http.status(400, "Bad Request")
        return
    end
    local arg = jsonc.parse(content)
    if arg == nil then
        luci.http.status(401, "Bad Request")
    end
    local server = arg["server"]
    local port   = arg["port"]
    if server == nil or port == nil then
        luci.http.status(402, "Bad Request")
    end
    local result = ssrui.test_ssr_server(server, port)
    if result == nil or result == "" then
        luci.http.status(500, "Internal Server Error")
    end
    luci.http.status(200, "OK")
    luci.http.write(result)
    return
end -->

function uploadfile_handle() --<
    local req_method = luci.http.getenv("REQUEST_METHOD")
    if req_method:lower() ~= "post" then
        luci.http.status(400, "Bad Request")
        luci.http.prepare_content("text/html")
        luci.http.write("<h1> FUCK FAULT ERROR </h1>")
        return 1
    end
    return upload.handle_http_request()
end -->

function copyfile_handle() --<
    local req_method = luci.http.getenv("REQUEST_METHOD")
    if req_method:lower() ~= "post" then
        luci.http.status(400, "Bad Request")
        luci.http.prepare_content("text/html")
        luci.http.write("<h1> FUCK FAULT ERROR </h1>")
        return 1
    end
    local content, len = luci.http.content()
    local tb = jsonc.parse(content)
    if len == 0 or tb == nil or tb["hash"] == nil or tb["name"] == nil or tb["url"] == nil then 
        luci.http.status(406, "Not Acceptable")
        return 1
    end
    local src_file = upload.tmp_file_dir .. tb["hash"] .. "file"
    local dst_file = ssrui.gfw_dir .. tb["hash"]
    if nfs.copy(src_file, dst_file) == nil then
        luci.http.status(404, "Not Found")
        return 1
    end
    luci.http.status(200, "OK")
    return 0
end -->

function delfile_handle() --<
    local req_method = luci.http.getenv("REQUEST_METHOD")
    if req_method:lower() ~= "post" then
        luci.http.status(400, "Bad Request")
        return 1
    end
    local content, len = luci.http.content()
    local tb = jsonc.parse(content)
    if len == 0 or tb == nil or tb["hash"] == nil then 
        luci.http.status(406, "Not Acceptable")
        return 1
    end
    local dir = upload.tmp_file_dir .. tb["hash"]
    os.execute("rm -rf " .. dir)
    luci.http.status(200, "OK")
    return 0
end -->
