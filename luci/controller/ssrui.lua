local io = require('io')
local os = require('os')
local string = require('string')
local table  = require('table')
local jsonc  = require('luci.jsonc')

module("luci.controller.ssrui", package.seeall)
function index()
		if not nixio.fs.access("/etc/config/ssrui") then
		return
	end
	local page
	page = entry({"admin", "services", "ssrui"}, cbi("ssrui"), _("SSR LuCI Web UI"))
	page.dependent = true
	entry({"admin", "services", "ssrui", "status"}, call("act_status")).leaf=true
    entry({"admin", "services", "ssrui", "request-json"}, call("handle_request_json")).leaf=true
end

function act_status()
  local e={}
  e.running=luci.sys.call("pgrep ssr-redir >/dev/null")==0
  luci.http.prepare_content("application/json")
  luci.http.write_json(e)
end


local __valid_json_files = {}
__valid_json_files["protocol_list"] = "/etc/ssrui/protocol_list.json"
__valid_json_files["method_list"]   = "/etc/ssrui/method_list.json"
__valid_json_files["obfs_list"]     = "/etc/ssrui/obfs_list.json"
__valid_json_files["server_list"]   = "/etc/ssrui/server_list.json"


function handle_request_json()
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
end


function response_with_json()
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
end

function handle_post_json()
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
end
