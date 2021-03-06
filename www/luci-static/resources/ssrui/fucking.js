/* SSRUI javascript */

function export_to_global(names) {
    names.map(x => eval("window." + x + " = window." + x + " || " + x));
}

function fucking_assert(what) //{
{
    if (!what)
        console.error("assert false, " + what.toString());
} //}

/** global variable list */
// store servers, and exchange with server as json format
// when the content of this array changed, fire event "serverChange" in document object
var VarAccessor = {};
VarAccessor.server_index = [];
exports.VarAccessor = VarAccessor;
// Encapsulate elements into a object
var ElementsAccessor = {};
exports.ElementsAccessor = ElementsAccessor;
function retry_get_elements() //{
{
// reference to server selector
    if (ElementsAccessor.server_list_elem     == null) ElementsAccessor.server_list_elem     = document.getElementById("user-server-list");
// list group
    if (ElementsAccessor.subscriptions_group  == null) ElementsAccessor.subscriptions_group  = document.getElementById("user-subscriptions-group");
    if (ElementsAccessor.links_group          == null) ElementsAccessor.links_group          = document.getElementById("user-links-group");
// buttons reference
    if (ElementsAccessor.config_submit_button == null) ElementsAccessor.config_submit_button = document.getElementById("config-button-submit");
    if (ElementsAccessor.config_reset_button  == null) ElementsAccessor.config_reset_button  = document.getElementById("config-button-reset");
    if (ElementsAccessor.config_delete_button == null) ElementsAccessor.config_delete_button = document.getElementById("config-button-delete");
    if (ElementsAccessor.subs_new_button      == null) ElementsAccessor.subs_new_button      = document.getElementById("subs-button-new");
    if (ElementsAccessor.subs_update_button   == null) ElementsAccessor.subs_update_button   = document.getElementById("subs-button-update");
    if (ElementsAccessor.subs_delete_button   == null) ElementsAccessor.subs_delete_button   = document.getElementById("subs-button-delete");
    if (ElementsAccessor.subs_syncro_button   == null) ElementsAccessor.subs_syncro_button   = document.getElementById("subs-button-sync");
    if (ElementsAccessor.subs_confirm_button  == null) ElementsAccessor.subs_confirm_button  = document.getElementById("subs-button-confirm");
    if (ElementsAccessor.test_output          == null) ElementsAccessor.test_output          = document.getElementById("user-text-output");
    if (ElementsAccessor.test_button          == null) ElementsAccessor.test_button          = document.getElementById("user-test-button");
    // info
    if (ElementsAccessor.update_info          == null) ElementsAccessor.update_info          = document.getElementById("update-info");
    if (ElementsAccessor.address_bar          == null) ElementsAccessor.address_bar          = document.getElementById("address-bar");

    if (ElementsAccessor.gfw_rename          == null) ElementsAccessor.gfw_rename = document.getElementById("gfw-rename");
    if (ElementsAccessor.gfw_delete          == null) ElementsAccessor.gfw_delete = document.getElementById("gfw-delete");
    if (ElementsAccessor.gfw_update          == null) ElementsAccessor.gfw_update = document.getElementById("gfw-update");
    if (ElementsAccessor.gfw_menu            == null) ElementsAccessor.gfw_menu   = document.getElementById("gfw-menu");
    if (ElementsAccessor.gfw_list            == null) ElementsAccessor.gfw_list   = document.getElementById("gfw-list");
    if (ElementsAccessor.gfw_post            == null) ElementsAccessor.gfw_post   = document.getElementById("gfw-post");
} //}
function elements_test() //{
{
    if (ElementsAccessor.server_list_elem     == null) console.error("Bad news, debug this");
    if (ElementsAccessor.subscriptions_group  == null) console.error("Bad news, debug this");
    if (ElementsAccessor.links_group          == null) console.error("Bad news, debug this");
    if (ElementsAccessor.config_submit_button == null) console.error("Bad news, debug this");
    if (ElementsAccessor.config_reset_button  == null) console.error("Bad news, debug this");
    if (ElementsAccessor.config_delete_button == null) console.error("Bad news, debug this");
    if (ElementsAccessor.subs_new_button      == null) console.error("Bad news, debug this");
    if (ElementsAccessor.subs_update_button   == null) console.error("Bad news, debug this");
    if (ElementsAccessor.subs_delete_button   == null) console.error("Bad news, debug this");
    if (ElementsAccessor.subs_syncro_button   == null) console.error("Bad news, debug this");
    if (ElementsAccessor.subs_confirm_button  == null) console.error("Bad news, debug this");
    if (ElementsAccessor.test_button          == null) console.error("Bad news, debug this");
    if (ElementsAccessor.test_output          == null) console.error("Bad news, debug this");
    if (ElementsAccessor.update_info          == null) console.error("Bad news, debug this");
    if (ElementsAccessor.address_bar          == null) console.error("Bad news, debug this");
    if (ElementsAccessor.gfw_delete           == null) console.error("Bad news, debug this");
    if (ElementsAccessor.gfw_rename           == null) console.error("Bad news, debug this");
    if (ElementsAccessor.gfw_update           == null) console.error("Bad news, debug this");
    if (ElementsAccessor.gfw_menu             == null) console.error("Bad news, debug this");
    if (ElementsAccessor.gfw_list             == null) console.error("Bad news, debug this");
    if (ElementsAccessor.gfw_post             == null) console.error("Bad news, debug this");
} //}
exports.retry_get_elements = retry_get_elements;
exports.elements_test = elements_test;

document.addEventListener("DOMContentLoaded", function() {
    retry_get_elements();
});

document.addEventListener("serverListChange", function(earg) {
    switch (earg.detail) {
        case "new":    update_server_list_when_add_new_server(); break;
        case "delete":
        case "update": update_server_list_select(VarAccessor.server_index); break;
        default: console.error("unexpected event detail."); return;
    };
    ElementsAccessor.server_list_elem.dispatchEvent(new Event("change"));
    return;
});


function update_form_configure() //{
{
    if (ElementsAccessor.server_list_elem == null) {console.log("id #user-servr-list doesn't exist"); return;}
    let index = ElementsAccessor.server_list_elem.selectedIndex;
    if (index == -1) {return;}
    let server_id = parseInt(ElementsAccessor.server_list_elem.options[index].getAttribute("value"));
    if (isNaN(server_id)) {console.log("bad number NaN"); return;}
    let update_list = ["server", "server_port", "local_address", "local_port", "password", 
        "method", "obfs", "protocol", "obfsparam", "protoparam", "remarks"];
    let server = {};
    if (server_id == 0) {
        for (let s in update_list)
            server[update_list[s]] = ""
    } else server = VarAccessor.server_index[server_id - 1];
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
        to_update.dispatchEvent(new CustomEvent("input"));
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
    if (ElementsAccessor.server_list_elem == null) {console.log("id #user-servr-list doesn't exist"); return;}
    let index = ElementsAccessor.server_list_elem.selectedIndex;
    let server_id = parseInt(ElementsAccessor.server_list_elem.options[index].getAttribute("value"));
    if (isNaN(server_id)) {console.log("bad number NaN"); return;}
    let server = {};
    let update_list = ["server", "server_port", "local_address", "local_port", "password", 
        "method", "obfs", "protocol", "obfsparam", "protoparam", "remarks"];
    if (server_id == 0) {
        for (let s in update_list)
            server[update_list[s]] = ""
    } else server = VarAccessor.server_index[server_id - 1];
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
        VarAccessor.server_index.push(server);
        document.dispatchEvent(new CustomEvent("serverListChange", {detail: "new"}));
    } else {
        document.dispatchEvent(new CustomEvent("serverListChange", {detail: "update"}));
    }
    return true;
} //}

function update_server_list_when_add_new_server() //{
{
    let index = ElementsAccessor.server_list_elem.selectedIndex;
    let new_option = document.createElement("option");
    new_option.value = VarAccessor.server_index.length;
    new_option.innerHTML = VarAccessor.server_index[VarAccessor.server_index.length - 1].remarks;
    let a = ElementsAccessor.server_list_elem.removeChild(ElementsAccessor.server_list_elem.lastChild);
    ElementsAccessor.server_list_elem.appendChild(new_option);
    ElementsAccessor.server_list_elem.appendChild(a);
    ElementsAccessor.server_list_elem.selectedIndex = index;
//    ElementsAccessor.server_list_elem.dispatchEvent(new Event("change"));
    return true;
} //}

function delete_current_config() //{
{
    let index = ElementsAccessor.server_list_elem.selectedIndex;
    let len = ElementsAccessor.server_list_elem.children.length;
    fucking_assert( len > 0);
    if (index == len - 1) {
        ElementsAccessor.config_reset_button.dispatchEvent(new Event("click"));
        return;
    }
    let new_server_index = [];
    for (let i = 0; i<index; ++i)
        new_server_index.push(VarAccessor.server_index[i]);
    for (let i = index + 1; i<VarAccessor.server_index.length; ++i)
        new_server_index.push(VarAccessor.server_index[i]);
    let data = classify_servers_by_group(new_server_index);
    update_server_list(data);
    if (len - index == 2 && index != 0)
        ElementsAccessor.server_list_elem.selectedIndex = index - 1;
    else
        ElementsAccessor.server_list_elem.selectedIndex = index;
    ElementsAccessor.config_reset_button.dispatchEvent(new Event("click"));
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
        if (e_id == null) return false;

        let pattern = /^(\w*)-(\w*)-tab$/i;
        let _id_match = _id.match(pattern)
        if (_id_match == null) return false;

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
        if (tab_panel == null) return false;
        tab_panel.style.display = "block";
        return true;
    }
} //}

function tab_click(_id) //{
{
    let tab_pattern = /^(\w*)-tab$/;
    let tab_match = _id.match(tab_pattern)
    if (tab_match == null) return false;
    let child_pattern = /^(\w*)-(\w*)-tab$/;
    let elem = document.getElementById(_id);
    if (elem == null) return false;
    for(let i = 0; i<elem.children.length; ++i) {
        let child = elem.children[i];
        let child_match = child.id.match(child_pattern);
        if (child_match == null) continue;
        if (child_match[1] != tab_match[1]) continue;
        elem.children[i].addEventListener("click", click_wrap(elem.children[i].id, "active"));
    }
    return true;
} //}


function update_method_protocol_obfs_list(item) //{
{
    if (XHR == null) return false;
    let ret = false;
    XHR.get('/cgi-bin/luci/admin/services/ssrui/request-json', {what: item + "_list"}, function(xhr, json_data) {
        let elem = document.getElementById("main-server-" + item);
        if (elem == null) {
            console.warn("undefined id #main-server-" + item);
            return false;
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
        ret = true;
        return true;
    });
    return ret;
} //}


function update_server_list_aux_empty() //{
{
    if (ElementsAccessor.server_list_elem == null || ElementsAccessor.server_list_elem.firstChild) return;
    let template = document.createElement("option");
    template.value = 0;
    template.innerHTML = "NEW";
    ElementsAccessor.server_list_elem.appendChild(template);
    return;
} //}

function update_server_list_select(servers) //{
{
    let old_index = ElementsAccessor.server_list_elem.selectedIndex;
    while (ElementsAccessor.server_list_elem.firstChild)
        ElementsAccessor.server_list_elem.removeChild(ElementsAccessor.server_list_elem.firstChild);

    let template = document.createElement("option");
    for(let i = 1; i<=servers.length; ++i) {
        let new_option = template.cloneNode(false);
        new_option.value = i;
        new_option.innerHTML = servers[i-1].remarks;
        ElementsAccessor.server_list_elem.appendChild(new_option);
    }
    template.value = 0;
    template.innerHTML = CONS.NewOption;
    ElementsAccessor.server_list_elem.appendChild(template);
    if(old_index < ElementsAccessor.server_list_elem.children.length - 1 && old_index >= 0)
        ElementsAccessor.server_list_elem.selectedIndex = old_index;
    else
        ElementsAccessor.server_list_elem.selectedIndex = 0;
    ElementsAccessor.server_list_elem.dispatchEvent(new Event("change"));
    return;
} //}

function update_server_list(json_data) //{
{
    if (ElementsAccessor.server_list_elem == null) return false;

    if (json_data == null) return false;
    let server_list = [];
    for (let i = 0; i<json_data.length; ++i) {
        let group = json_data[i].server_list;
        for (let j = 0; j<group.length; ++j) {
            let server = group[j];
            if (server.remarks == null) continue;
            server.group     = json_data[i].group ? json_data[i].group : "undefined group";
            if(server["subs_link"] == null)
                server["subs_link"] = "UNKOWN SOURCE";
            server_list.push(server);
        }
    }

    VarAccessor.server_index = server_list;
    document.dispatchEvent(new CustomEvent("serverListChange", {detail: "update"}));
    ElementsAccessor.server_list_elem.dispatchEvent(new Event("change"));
    return true;
} //}
exports.update_server_list = update_server_list;


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
exports.classify_servers_by              = classify_servers_by;
exports.classify_servers_by_group        = classify_servers_by_group;
exports.classify_servers_by_subscription = classify_servers_by_subscription;

function servers_json_to_list(server_json) //{
{
    let ret_list = [];
    for (let i in server_json) {
        let group_name = server_json[i]["group"];
        let xx = server_json[i]["server_list"];
        if ( xx == null) continue;
        for (let s in xx) {
            if(xx[s]["group"] == null)
                xx[s]["group"] = group_name;
            ret_list.push(xx[s]);
        }
    }
    return ret_list;
} //}
exports.servers_json_to_list = servers_json_to_list;

export_to_global(["tab_click", "update_form_configure", "update_server_list", 
                  "update_server_list_select", "update_server_list_from_form", 
                  "delete_current_config", "ElementsAccessor", "VarAccessor"]);
