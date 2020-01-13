/// <reference path="../www/luci-static/resources/ssrui/fucking.js"/>

import {SSRServer, SSRSubscription, default_local_address, default_local_port} from './subscribe';
import {UActiveChange, UContentChange} from './event';
import * as fucking from '../www/luci-static/resources/ssrui/fucking';

document.addEventListener("DOMContentLoaded", function() {
    fucking.retry_get_elements();
    fucking.ElementsAccessor.subscriptions_group.addEventListener(UContentChange, function() {
        update_list_group(fucking.ElementsAccessor.subscriptions_group, ["hello", "world"], ["list-group-item"], "subscription", true, "NEW");
    });
    fucking.ElementsAccessor.links_group.addEventListener(UContentChange, function() {
        update_list_group(fucking.ElementsAccessor.links_group, ["hello-link", "world-link"], ["list-group-item"], "links", false);
        console.log("HELLO EVENT");
    });
    fucking.ElementsAccessor.links_group.dispatchEvent(new CustomEvent(UContentChange));
    fucking.ElementsAccessor.subscriptions_group.dispatchEvent(new CustomEvent(UContentChange));
    fucking.ElementsAccessor.links_group.addEventListener("click", (ev: MouseEvent) => {
        list_click_change_active(ev);
    });
    fucking.ElementsAccessor.subscriptions_group.addEventListener("click", (ev: MouseEvent) => {
        list_click_change_active(ev);
    });
});

// (ul | or) > li > a.active
export function list_click_change_active(eargs: Event): void //{
{
    let origin_target: Element  = eargs.target as Element;
    let current_target: Element = eargs.currentTarget as Element;
    if (!current_target.nodeName.toLowerCase().match(/(ul)|(ol)/)) return;
    if (origin_target.nodeName.toLowerCase() != "a") return;
    if (origin_target.parentNode.nodeName.toLowerCase() != "li") return;
    if (origin_target.parentNode.parentNode != current_target) return;
    eargs.stopPropagation();
    if (origin_target.classList.contains("active")) return;
    for(let i = 0; i<current_target.children.length; ++i) {
        current_target.children[i].children[0].classList.remove("active");
    }
    origin_target.classList.add("active");
} //}

export function update_list_group(
    list: Element, msgs: string[], extra_classes: string[], href_and_id_prefix: string,
    new_button: boolean = false, new_button_str: string = "NEW"): void //{
{
    if (!list.nodeName.toLowerCase().match(/(ol)|(ul)/)) return;
    let k: number = 0;
    for(let j = 0; j<list.children.length; ++j) {
        if (list.children[j].nodeName.toLowerCase() != "li")
            continue;
        if (list.children[j].children[0].classList.contains("active"))
            break;
        ++k;
    }
    while(list.lastChild)
        list.removeChild(list.lastChild);
    if (msgs.length == 0 && !new_button) return;
    let new_node_li = document.createElement("li");
    let new_node    = document.createElement("a");
    new_node_li.appendChild(new_node);
    for(let i = 0; i<msgs.length; ++i) {
        let nn: Element = new_node_li.cloneNode(true) as Element;
        nn.children[0].setAttribute("href", "#" + href_and_id_prefix + (i + 1));
        nn.children[0].setAttribute("id",   href_and_id_prefix + "-" + (i + 1));
        nn.children[0].innerHTML = msgs[i];
        extra_classes.map(cls => nn.children[0].classList.add(cls));
        list.appendChild(nn);
    }
    if (new_button) {
        new_node.setAttribute("href", "#" + href_and_id_prefix + "0");
        new_node.setAttribute("id",   href_and_id_prefix + "-" + "0");
        new_node.innerHTML = new_button_str;
        extra_classes.map(cls => new_node.classList.add(cls));
        list.appendChild(new_node_li);
    }
    if (list.children.length <= k)
        (list.lastChild.firstChild as Element).classList.add("active");
    else
        list.children[k].children[0].classList.add("active");
    return;
} //}
