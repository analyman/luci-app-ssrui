/* UTILS */

export function createNodeFromHtmlString(htmlText: string): HTMLElement //{
{
    let div = document.createElement("div");
    div.innerHTML = htmlText.trim();
    return div.firstChild as HTMLElement;
} //}

export function isHidden(elem: HTMLElement): boolean //{
{
    return elem.offsetParent == null;
} //}

export function makeid(length: number): string //{
{
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghipqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ )
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    return result;
} //}

/*                          TAB Implement
 * The pattern of id of tab list is /^(\w*)-tab$/, here let group[1] as 
 * first match group of this pattern. So id of tab panels should match /^group[1]-(\w*)-tab$/.
 */
export function click_wrap(_id, _class) //{
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
export function tab_click(_id) //{
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

export function assert(val: boolean) //{
{
    if(!val) 
        console.error("debug");
} //}



