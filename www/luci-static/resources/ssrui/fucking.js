/* SSRUI javascript */

function fucking_assert(what) //{
{
    if (!what)
        console.error("assert false, " + what.toString());
} //}

/** global variable list */
// store servers, and exchange with server as json format
var server_index = []
// reference to server selector
var server_list_elem = document.getElementById("user-server-list");
document.addEventListener("DOMContentLoaded", function() {
    if (server_list_elem == null)
        server_list_elem = document.getElementById("user-server-list");
    if (server_list_elem == null)
        console.error("Bad news, debug this");
});
// buttons reference
var config_submit_button = document.getElementById("config-button-submit");
var config_reset_button  = document.getElementById("config-button-reset");
var config_delete_button = document.getElementById("config-button-delete");
var subs_new_button      = document.getElementById("subs-button-new");
var subs_update_button   = document.getElementById("subs-button-update");
var subs_delete_button   = document.getElementById("subs-button-delete");
document.addEventListener("DOMContentLoaded", function() {
    if (config_submit_button == null) config_submit_button = document.getElementById("config-button-submit");
    if (config_reset_button  == null) config_reset_button  = document.getElementById("config-button-reset");
    if (config_delete_button == null) config_delete_button = document.getElementById("config-button-delete");
    if (subs_new_button      == null) subs_new_button      = document.getElementById("subs-button-new");
    if (subs_update_button   == null) subs_update_button   = document.getElementById("subs-button-update");
    if (subs_delete_button   == null) subs_delete_button   = document.getElementById("subs-button-delete");
    if (config_submit_button == null) console.error("Bad news, debug this");
    if (config_reset_button  == null) console.error("Bad news, debug this");
    if (config_delete_button == null) console.error("Bad news, debug this");
    if (subs_new_button      == null) console.error("Bad news, debug this");
    if (subs_update_button   == null) console.error("Bad news, debug this");
    if (subs_delete_button   == null) console.error("Bad news, debug this");
});

var subscriptions_group = document.getElementById("user-subscriptions-group");
var links_group         = document.getElementById("user-links-group");
document.addEventListener("DOMContentLoaded", function() {
    if (subscriptions_group == null) subscriptions_group = document.getElementById("user-subscriptions-group");
    if (links_group         == null) links_group         = document.getElementById("links_group");
    if (subscriptions_group == null) console.error("Bad news, debug this");
    if (links_group         == null) console.error("Bad news, debug this");
    subscriptions_group.addEventListener("activeChange", function() {
    });
    links_group.addEventListener("contentChange", function() {
    });
}

function update_form_configure() //{
{
    if (server_list_elem == null) {console.log("id #user-servr-list doesn't exist"); return;}
    let index = server_list_elem.selectedIndex;
    if (index == -1) {return;}
    let server_id = parseInt(server_list_elem.options[index].getAttribute("value"));
    if (isNaN(server_id)) {console.log("bad number NaN"); return;}
    let update_list = ["server", "server_port", "local_address", "local_port", "password", 
        "method", "obfs", "protocol", "obfsparam", "protoparam", "remarks"];
    let server = {};
    if (server_id == 0) {
        for (let s in update_list)
            server[update_list[s]] = ""
    } else server = server_index[server_id - 1];
    if (server == null) {console.log("unexcepted null value"); return;}
    for (let s in update_list) {
        let to_update = document.getElementById("main-server-" + update_list[s].replace(/[_]/g, "-"));
        if (to_update == null) {
            console.warn("id #main-server-" + update_list[s].replace(/[_]/g, "-") + " doesn't exist");
            continue;
        }
        let value = server[update_list[s]];
        if (value == null) {
            console.warn("unexception null value, remote json file may be corrupted.")
            continue;
        }
        to_update.setAttribute("value", value);
        to_update.value = value;
    }
        let remarks_elem = document.getElementById("main-server-remarks");
        if (remarks_elem == null) {console.warn("unexpected null"); return false;}
    if (server_id == 0)
        remarks_elem.parentNode.parentNode.style.display = "table-row";
    else
        remarks_elem.parentNode.parentNode.style.display = "none";
    return true;
} //}

function update_server_list_from_form() //{
{
    if (server_list_elem == null) {console.log("id #user-servr-list doesn't exist"); return;}
    let index = server_list_elem.selectedIndex;
    let server_id = parseInt(server_list_elem.options[index].getAttribute("value"));
    if (isNaN(server_id)) {console.log("bad number NaN"); return;}
    let server = {};
    let update_list = ["server", "server_port", "local_address", "local_port", "password", 
        "method", "obfs", "protocol", "obfsparam", "protoparam", "remarks"];
    if (server_id == 0) {
        for (let s in update_list)
            server[update_list[s]] = ""
    } else server = server_index[server_id - 1];
    if (server == null) {console.log("unexcepted null value"); return;}
    for (let s in update_list) {
        let update_with = document.getElementById("main-server-" + update_list[s].replace(/[_]/g, "-"));
        if (update_with == null) {
            console.warn("id #main-server-" + update_list[s].replace(/[_]/g, "-") + " doesn't exist");
            continue;
        }
        update_with.setAttribute("value", update_with.value);
        server[update_list[s]] = update_with.getAttribute("value");
    }
    if (server_id == 0) {
        server["group"] = "USER-DEFINED";
        server["subs_link"] = "USER";
        server_index.push(server);
        update_server_list_when_add_new_server();
    }
    return true;
} //}

function update_server_list_when_add_new_server() //{
{
    let index = server_list_elem.selectedIndex;
    let new_option = document.createElement("option");
    new_option.value = server_index.length;
    new_option.innerHTML = server_index[server_index.length - 1].remarks;
    let a = server_list_elem.removeChild(server_list_elem.lastChild);
    server_list_elem.appendChild(new_option);
    server_list_elem.appendChild(a);
    server_list_elem.selectedIndex = index;
    server_list_elem.dispatchEvent(new Event("change"));
    return true;
} //}

function delete_current_config() //{
{
    let index = server_list_elem.selectedIndex;
    fucking_assert(server_list_elem.children.length > 0);
    if (index == server_list_elem.children.length - 1) {
        config_reset_button.dispatchEvent(new Event("click"));
        return;
    }
    let new_server_index = [];
    for (let i = 0; i<index; ++i)
        new_server_index.push(server_index[i]);
    for (let i = index + 1; i<server_index.length; ++i)
        new_server_index.push(server_index[i]);
    let data = classify_servers_by_group(new_server_index);
    update_server_list(data);
    if (index > 0)
        server_list_elem.selectedIndex = index - 1;
    else
        server_list_elem.selectedIndex = 0;
    config_reset_button.dispatchEvent(new Event("click"));
    return;
} //}

/* TAB Implement
 * The pattern of id of tab list is /^(\w*)-tab$/, here let group[1] as 
 * first match group of this pattern. So id of tab panels should match /^group[1]-(\w*)-tab$/.
 */
function click_wrap(_id, _class) //{
{
    return function() {
        let e_id = document.getElementById(_id)
        if (e_id == null) return 1;

        let pattern = /^(\w*)-(\w*)-tab$/i;
        let _id_match = _id.match(pattern)
        if (_id_match == null) return 1;

        let _children = e_id.parentNode.children;
        for (let i = 0; i < _children.length; i++) {
            _children[i].classList.remove(_class);
            // remove corresponding tab panel
            let i_match = _children[i].id.match(pattern)
            if (i_match == null) continue;
            let tab_panel = document.getElementById(i_match[1] + "-" + i_match[2] + "-" + "content");
            if (tab_panel == null) continue;
            tab_panel.style.display = "none";
        }
        e_id.classList.add(_class);
        let tab_panel = document.getElementById(_id_match[1] + "-" + _id_match[2] + "-" + "content");
        if (tab_panel == null) return 1;
        tab_panel.style.display = "block";
        return 0;
    }
} //}

function tab_click(_id) //{
{
    let tab_pattern = /^(\w*)-tab$/;
    let tab_match = _id.match(tab_pattern)
    if (tab_match == null) return 1;
    let child_pattern = /^(\w*)-(\w*)-tab$/;
    let elem = document.getElementById(_id);
    if (elem == null) return 1;
    for(let i = 0; i<elem.children.length; ++i) {
        let child = elem.children[i];
        let child_match = child.id.match(child_pattern);
        if (child_match == null) continue;
        if (child_match[1] != tab_match[1]) continue;
        elem.children[i].addEventListener("click", click_wrap(elem.children[i].id, "active"));
    }
} //}


// DEPRECATED
function fetch_what_json(what_json) //{
{
    if (XHR == null) return null;
    let res = {}
    XHR.get('/cgi-bin/luci/admin/services/ssrui/request-json', {what: what_json}, function(xhr, json_data) {
        res = json_data;
    });
    if (res == {}) return null;
    return res;
} //}

function update_method_protocol_obfs_list(item) //{
{
    if (XHR == null) return null;
    XHR.get('/cgi-bin/luci/admin/services/ssrui/request-json', {what: item + "_list"}, function(xhr, json_data) {
        let elem = document.getElementById("main-server-" + item);
        if (elem == null) {
            console.warn("undefined id #main-server-" + item);
            return null;
        }
        while (elem.firstChild) 
            elem.removeChild(elem.firstChild);
        let template = document.createElement("option");
        for(let i = 0; i<json_data.length; ++i) {
            let new_option = template.cloneNode(false);
            new_option.value = json_data[i];
            new_option.innerHTML = json_data[i];
            elem.appendChild(new_option);
        }
        return null;
    });
} //}


function update_server_list_aux_empty() //{
{
    if (server_list_elem == null || server_list_elem.firstChild) return;
    let template = document.createElement("option");
    template.value = 0;
    template.innerHTML = "NEW";
    server_list_elem.appendChild(template);
    return;
} //}

function update_server_list_select(servers) //{
{
    while (server_list_elem.firstChild)
        server_list_elem.removeChild(server_list_elem.firstChild);

    let template = document.createElement("option");
    for(let i = 1; i<=servers.length; ++i) {
        let new_option = template.cloneNode(false);
        new_option.value = i;
        new_option.innerHTML = servers[i-1].remarks;
        server_list_elem.appendChild(new_option);
    }
    template.value = 0;
    template.innerHTML = "NEW";
    server_list_elem.appendChild(template);
    return;
} //}

function update_server_list(json_data) //{
{
    if (server_list_elem == null) return false;

    if (json_data == null) return false;
    let server_list = [];
    for (let i = 0; i<json_data.length; ++i) {
        let group = json_data[i].server_list;
        for (let j = 0; j<group.length; ++j) {
            let server = group[j];
            if (server.remarks == null) continue;
            server.group     = json_data[i].group ? json_data[i].group : "undefined group";
            server.subs_link = json_data[i].subs_link ? json_data[i].subs_link : "UNKOWN SOURCE";
            server_list.push(server);
        }
    }

    server_index = server_list;
    update_server_list_select(server_index);
    return true;
} //}


function classify_servers_by(server_list, what) //{
{
    let groups = {};
    for (let i in server_list) {
        let g = server_list[i][what];
        if (g == null) continue;
        if (groups[g] == null) groups[g] = [];
        groups[g].push(server_list[i]);
    }
    let ret = [];
    for (let i in groups)
        ret.push({group: i, server_list: groups[i]});
    return ret;
} //}
function classify_servers_by_group(server_list) //{
{
    return classify_servers_by(server_list, "group");
} //}
function classify_servers_by_subscription(server_list) //{
{
    return classify_servers_by(server_list, "subs_link");
} //}

function servers_json_to_list(server_json) //{
{
    let ret_list = [];
    for (let i in server_json) {
        let group_name = server_json["group"];
        let xx = server_json["server_list"];
        if ( xx == null) continue;
        for (let s in xx) {
            xx[s].group = group_name;
            ret_list.push(xx[s]);
        }
    }
    return ret_list;
} //}
