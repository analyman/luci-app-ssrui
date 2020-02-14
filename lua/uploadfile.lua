--< Require
local io     = require('io')
local os     = require('os')
local string = require('string')
local table  = require('table')

local nfs    = require('nixio.fs')
local json   = require('luci.jsonc')
local lhttp  = require('luci.http')

local log = require('log')
log.outfile = "/var/run/ssrui_luci.log"
--> End Require

local module = {}

--< Constant
local tmp_file_dir = "/tmp/upload_dir/"
module.tmp_file_dir = tmp_file_dir
-- record as the format is [hash, max_sequence_num, slice_length, state]
local file_table   = "/tmp/upload_file_table"

local MAX_INTERVAL = 300 -- 300s
--> End Constant

--< Utils
local hexdigit = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
local function U_random_str(n) --< => string
    assert(type(n) == "number")
    if n <= 1 then n = 1 end
    math.randomseed(os.time())
    local len = hexdigit:len()
    local res = string.char(hexdigit:byte(math.random(11, len)))
    local i = 2
    while i <= n do
        res = res .. string.char(hexdigit:byte(math.random(1, len)))
        i = i + 1
    end
    return res
end -->

local function U_sleep(n) -- => void --<
    -- this command requires coreutils-sleep package in openwrt
    os.execute("/usr/bin/sleep " .. tostring(n))
    return
end -->
module.sleep = U_sleep

local __pid = nil
local function U_get_pid() --< => number
    -- work in linux
    if __pid == nil then
        local pstat_fd = io.open("/proc/self/stat", "r")
        if pstat_fd == nil then return nil end
        local pstat = pstat_fd:read("*a")
        pstat_fd:close()
        local _a, _b = string.find(pstat, "^%d*")
        local pid = pstat:sub(_a, _b)
        __pid = tonumber(pid)
    end
    assert(__pid ~= nil)
    return __pid
end -->

local function U_concat_path(dir, ...) --<
    local name = ""
    local i = 1
    while i <= #arg do
        if i == #arg then
            name = name .. arg[i]
        else
            name = name .. arg[i] .. "/"
        end
        i = i + 1
    end
    local res
    if dir:byte(dir:len()) == string.byte("/", 1) then
        res = dir .. name
    else
        res = dir .. "/" .. name
    end
    return res
end -->

local function U_binary_search(array, val) -- => number --<
    local down, up = 1, #array
    while down <= up do 
        local test = math.floor((down + up) / 2)
        if array[test] == val then return test end
        if array[test] > down then 
            down = test + 1
        else
            up = test - 1
        end
    end
    return nil
end -->

local function U_in_array(array, val) -- => boolean --<
    log.debug("test " .. tostring(val) .. " in " .. json.stringify(array))
    assert(type(val) == "number")
    local i, e = 1, #array
    while i <= e do
        assert(type(array[i]) == "number")
        if array[i] == val then 
            log.debug("---- in")
            return true, i 
        end
        i = i + 1
    end
    log.debug("---- not in")
    return false
end -->

local function U_append_seq(filename, seq) -- => void --<
    local fd
    fd = io.open(filename, "a")
    assert(fd)
    fd:write(seq, "\n")
    fd:close()
end -->

local function U_hash_exist(hash) -- => boolean --<
    if nfs.stat(U_concat_path(tmp_file_dir, hash), "type") ~= "dir" then
        log.warn(U_concat_path(tmp_file_dir, hash), " doesn't exsit")
        return false
    end
    return true
end -->
--> End Utils

--< Mutex
-- mutex functions, process safe
local max_suspend_time = 5 -- 5 second
local function M_acquire_file_lock(filename) -- => boolean --<
    local sid = "|" .. U_random_str(8) .. "| "
    log.debug(sid .. "acquire file lock <", filename, ">")
    assert(filename ~= nil)
    local suspend = 0.01

    -- clear outdate lock
    local file_mtime = nfs.stat(filename .. ".lock", "mtime")
    if (file_mtime and (os.time() - file_mtime) > 10) then nfs.rmdir(filename .. ".lock") end

    -- acquire loop
    while (true) do
        if nfs.mkdir(filename .. ".lock") then
            return true
        end
        log.debug(sid .. "sleep " .. suspend .. " second, at " .. os.time())
        U_sleep(suspend)
        if (suspend >= max_suspend_time / 2) then
            log.debug(sid .. "fail to get lock")
            return false
        end
        suspend = suspend * 2
    end
end -->
local function M_release_file_lock(filename) -- => void --<
    if nfs.rmdir(filename .. ".lock") then
        log.debug("release file lock <", filename, ">")
    else
        log.error("here is a file mutex bug, in unlock file mutex <" .. filename .. ">")
    end
end -->
local function M_acquire_table_lock() return M_acquire_file_lock(file_table) end
local function M_release_table_lock() return M_release_file_lock(file_table) end
--> End Mutex

--< Table
--[
--@reutrn if not empty table of sessions, otherwise {}
--]
local function T_get_sessions_list() -- => table --<
    local fd
    if nfs.stat(file_table, "type") == nil then
        fd = io.open(file_table, "w")
        fd:write("")
        fd:close()
    end
    fd = io.open(file_table, "r")
    if fd == nil then return nil end
    local ss = fd:read("*a")
    fd:close()
    local res = {}
    for hash, max_sequence_num, slice_length, state in string.gfind(ss, "(%w+)%s*,%s*(%d+)%s*,%s*(%d+)%s*,%s*(%w+)%s*$") do
        res[hash] = {hash, max_sequence_num, slice_length, state}
    end
    return res
end -->

--[
--@param filename path to file that contain sequence number of transfered slices
--@return a list of sequence number
--]
local function T_get_file_info(filename) -- => table --<
    local fd
    if nfs.stat(filename, "type") == nil then
        fd = io.open(filename, "w")
        fd:write("")
        fd:close()
    end
    fd = io.open(filename, "r")
    if fd == nil then return nil end
    local ss = fd:read("*a")
    local res = {}
    for val in string.gfind(ss, "%s*(%d+)%s*") do
        res[#res + 1] = tonumber(val)
    end
    return res
end -->

--[
--@param tab table of sessions
--]
local function T_write_back_table(tab) -- => boolean --<
    os.remove(file_table)
    local buf = ""
    for _, val in next, tab do
        buf = buf .. val[1] .. ", " .. val[2] .. ", " .. val[3] .. ", " .. val[4] .. "\n"
    end
    if nfs.writefile(file_table, buf) == nil then
        log.error("write buffer to file " .. file_table .. " fail")
        return false
    end
    return true
end -->
--> End Table

--< Core
local function C_merge_temp_files(hash) -- => void --<
    log.debug("merge file whose hash is " .. hash)
    local main_fd = io.open(U_concat_path(tmp_file_dir, hash, "file"),"w")
    while true do
        if M_acquire_file_lock(U_concat_path(tmp_file_dir, hash, "table")) then break end
    end
    local file_table = T_get_file_info(U_concat_path(tmp_file_dir, hash, "table"))
    M_release_file_lock(U_concat_path(tmp_file_dir, hash, "table"))
    os.remove(U_concat_path(tmp_file_dir, hash, "table"))
    table.sort(file_table)
    local prev = nil -- avoid openning duplicated files
    for _, num in ipairs(file_table) do
        if prev ~= num then
            local tmp_fd = io.open(U_concat_path(tmp_file_dir, hash, num), "r")
            main_fd:write(tmp_fd:read("*a"))
            tmp_fd:close()
            os.remove(U_concat_path(tmp_file_dir, hash, num))
        end
        prev = num
    end
    main_fd:close()
    return
end -->

local function C_handle_add_slice(file_status, seq_num, data) -- => boolean --<
    log.debug("Add slice, [hash: ", file_status[1], "sequence number: ", seq_num, "data length: ", data:len(), "]")
    local hash = file_status[1]
    local table_f = U_concat_path(tmp_file_dir, hash, "table")
    if M_acquire_file_lock(table_f) == false then return nil end
    local array = T_get_file_info(table_f)
    if array == nil then
        M_release_file_lock(table_f)
        return nil
    end
    if U_in_array(array, tonumber(seq_num)) then
        M_release_file_lock(table_f)
        return {}, false
    end
    U_append_seq(table_f, seq_num)
    M_release_file_lock(table_f)
    array[#array + 1] = tonumber(seq_num)
    table.sort(array)
    log.debug("array is " .. json.stringify(array))
    local fd = io.open(U_concat_path(tmp_file_dir, hash, seq_num), "w")
    assert(fd)
    fd:write(data)
    fd:close()
    local holes = {}
    local i = 1
    local prev = array[1]
    local seq_init = tonumber(file_status[2]) - tonumber(file_status[3]) + 1
    while seq_init < prev do
        holes[#holes + 1] = seq_init
        seq_init = seq_init + 1
    end
    i = 2
    while i <= #array do
        if (prev + 1) ~= array[i] then
            local j = prev + 1
            while j < array[i] do
                holes[#holes + 1] = j
                j = j + 1
            end
        end
        prev = array[i]
        i = i + 1
    end
    return holes, #holes == 0 and #array == tonumber(file_status[3])
end -->

local function C_handle_http_request() -- => boolean --<
    local handshake = lhttp.formvalue("Handshake")
    local hash      = lhttp.formvalue("Hash")
    if handshake ~= nil then
    --< handshake
        log.debug("handshake with " .. hash)
        local max_sequence = lhttp.formvalue("Max-Sequence")
        local slice_length = lhttp.formvalue("Slice-Length")
        if max_sequence == nil or slice_length == nil then
            lhttp.write("@Max-Sequence and @Slice-Length is required in handshake")
            lhttp.status(400, "Bad Request")
            return false
        end
        if M_acquire_table_lock() == false then 
            lhttp.status(500, "Internal Server Error")
            lhttp.write("retry")
            return false
        end
        local tab = T_get_sessions_list()
        if tab[hash] ~= nil and tab[hash][4] == "COLLECT" then
            local old_time, cur_time = nfs.stat(U_concat_path(tmp_file_dir, hash), "mtime"), os.time()
            if old_time and ((cur_time - old_time) < MAX_INTERVAL) then
                lhttp.status(403, "Forbidden")
                lhttp.write("already in handshake")
                M_release_table_lock()
                return false
            end
        end
        tab[hash] = {hash, max_sequence, slice_length, "COLLECT"}
        T_write_back_table(tab)
        M_release_table_lock()
        local dir__ = U_concat_path(tmp_file_dir, hash)
        os.execute("rm -rf " .. dir__ .. "; mkdir -p " .. dir__)
        if nfs.stat(U_concat_path(tmp_file_dir, hash), "type") ~= "dir" then
            lhttp.status(500, "Internal Server Error")
            return false
        end
        os.execute("touch " .. U_concat_path(dir__, "table"))
        lhttp.status(200, "OK")
        return true -->
    end
    if M_acquire_table_lock() == false then 
        lhttp.status(500, "Internal Server Error")
        lhttp.write("retry")
        return false
    end
    local tab = T_get_sessions_list()
    M_release_table_lock()
    if tab == nil then 
        lhttp.status(500, "Internal Server Error")
        lhttp.write("retry")
        return false
    end
    local file_status = tab[hash]
    local seq = tonumber(lhttp.formvalue("Sequence-Number"))
    if file_status == nil or seq == nil or (not U_hash_exist(hash)) then
        lhttp.status(400, "Bad Request")
        log.warn(json.stringify({tab=tab, seq=seq, hash=hash}, true))
        return false
    end
    if file_status[5] == "FINISH" then -- duplicated content
        lhttp.status(208, "Existed")
        return true
    end
    local _, data
    data, _ = lhttp.content()
    local holes, finish = C_handle_add_slice(file_status, seq, data)
    if finish then
        while true do
            if M_acquire_table_lock() then break end
        end
        tab = T_get_sessions_list()
        local hash_status = tab[hash]
        hash_status[4] = "FINISH"
        T_write_back_table(tab)
        M_release_table_lock()
        C_merge_temp_files(hash)
    end
    lhttp.status(200, "OK")
    lhttp.prepare_content("application/json")
    lhttp.write(json.stringify({holes=holes, ack=seq, finish=finish}))
    return true
end -->
module.handle_http_request = C_handle_http_request
--> End Core

return module
