/* CSS INJECTOR */
import * as utils from './utils';

let as_least_of_number = 20;

export class CSSInjector //{
{
    count_of_items: number;
    deleted_items:  number;
    map_of_sheet:   Map<string, number>;
    div_elem:       HTMLDivElement;
    save_parent:    HTMLDivElement;
    constructor(div_id: string) {
        this.div_elem = document.getElementById(div_id) as HTMLDivElement;
        if(this.div_elem == null || this.div_elem.nodeName.toLowerCase() != "div") {
            console.error(`id "${div_id}" doesn't exist, or it isn't a div node`);
        }
        this.div_elem.style.display = "none";
        this.save_parent = null;
        while(this.div_elem.firstChild)
            this.div_elem.removeChild(this.div_elem.firstChild);
        this.div_elem.appendChild(utils.createNodeFromHtmlString("<div></div>"));
        this.div_elem = this.div_elem.firstChild as HTMLDivElement;
    }

    private recontructor(): void {
        if(this.deleted_items * 2 <= this.count_of_items || this.count_of_items <= as_least_of_number) {
            return;
        }
        let delete_assure = 0;
        let new_div: HTMLDivElement = utils.createNodeFromHtmlString("<div></div>") as HTMLDivElement;
        let new_map = new Map<string, number>();
        for(let i = 0; i<this.div_elem.children.length; ++i) {
            if(this.div_elem.children[i].nodeName.toLowerCase() != "style") {
                delete_assure++;
                continue;
            }
            new_div.appendChild(this.div_elem.children[i]);
            new_map[(new_div.lastChild as any)._index_id] = new_div.children.length - 1;
        }
        if(delete_assure != this.deleted_items) {
            console.error("find a bug");
        }
        this.map_of_sheet = new_map;
        this.div_elem.parentNode.replaceChild(new_div, this.div_elem);
        this.div_elem = new_div;
        this.deleted_items = 0;
        this.count_of_items = this.div_elem.children.length;
        return;
    }

    private check_node(css: Element): boolean {
        if(css.nodeName.toLowerCase() != "style") {
            console.error("error node, expect a <style> node");
            return false;
        }
        return true;
    }

    replace(css_string: string, id: string): boolean {
        let node: Element = utils.createNodeFromHtmlString(css_string) as Element;
        if(node == null) return false;
        this.replace_child(node, id);
        return true;
    }
    replace_child(css: Element, id: string): void {
        this.check_node(css);
        if(this.map_of_sheet[id] == null) {
            console.error("what you want to replace");
        }
        (css as any)._index_id = id; // for reconstructing mapping
        this.div_elem.replaceChild(css, this.div_elem.children[this.map_of_sheet[id]]);
        return;
    }

    append(css_string: string, id: string): boolean {
        let node: Element = utils.createNodeFromHtmlString(css_string) as Element;
        if(node == null) return false;
        this.append_child(node, id);
        return true;
    }
    append_child(css: Element, id: string): void {
        this.check_node(css);
        if (this.map_of_sheet[id] != null) {
            this.replace_child(css, id);
            return;
        }
        this.map_of_sheet[id] = this.div_elem.children.length;
        (css as any)._index_id = id; // for reconstructing mapping
        this.div_elem.appendChild(css);
        this.count_of_items++;
        return;
    }

    delete_node(id: string): void {
        if(this.map_of_sheet[id] == null) return;
        this.div_elem.replaceChild(utils.createNodeFromHtmlString("<div></div>"), this.div_elem.children[this.map_of_sheet[id]]);
        this.map_of_sheet[id] = null;
        this.deleted_items++;
        this.recontructor();
        return;
    }

    toggle(): void {
        if(this.save_parent != null) {
            this.save_parent = this.div_elem.parentNode as HTMLDivElement;
            this.save_parent.removeChild(this.div_elem);
        } else {
            this.save_parent.appendChild(this.div_elem);
            this.save_parent = null;
        }
        return;
    }
} //}
