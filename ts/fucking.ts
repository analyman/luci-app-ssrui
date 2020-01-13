import {SSRServer, SSRSubscription, default_local_address, default_local_port} from './subscribe';
import {UActiveChange, UContentChange} from './event';

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
    for(let i in current_target.children)
        current_target.children[i].children[0].classList.remove("active");
    origin_target.classList.add("active");
} //}

export function update_list_group(
    list: Element, msgs: string[], extra_classes: string[], href_and_id_prefix: string,
    new_button: boolean = false, new_button_str: string = "NEW"): void //{
{
    if (!list.nodeName.toLowerCase().match(/(ol)|(ul)/)) return;
    let k: number = 0;
    for(let j in list.children) {
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
    for(let i in msgs) {
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
        extra_classes.map(cls => new_node.classList.add(cls));
        list.appendChild(new_node_li);
    }
    if (list.children.length <= k)
        (list.lastChild.firstChild as Element).classList.add("active");
    else
        list.children[k].children[0].classList.add("active");
    return;
} //}
