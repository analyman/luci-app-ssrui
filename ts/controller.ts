import * as event from "./event";
import * as cssinjector from './css_injector';
import * as utils from './utils';
import * as CONS from './constants';

/*
 * show() and hide() is implemented with "dispaly: none;",
 * and may be with css animation
 */
export class ControllerBase extends event._EventTarget //{
{
    element:        HTMLElement;
    injector:       cssinjector.CSSInjector;
    private attach_state: string;
    private display_state: string;
    private id:     string;
    public show(): void {
        this.element.style.display = "";
        this.display_state = "SHOW";
    }
    public hide():  void {
        this.element.style.display = "none";
        this.display_state = "HIDE";
    }
    public remove(): void {
        if(this.attach_state == "REMOVE") return;
        this.element.parentNode.removeChild(this.element);
        this.attach_state = "REMOVE";
    }
    public attach_to(elem: HTMLElement, index?: number): number {
        if(this.attach_state = "ATTACH") this.remove();
        this.attach_state = "ATTACH";
        let len = elem.children.length;
        if(index < 0 || index == null || len <= index) {
            elem.appendChild(elem);
            return len;
        }
        elem.insertBefore(this.element, elem.children[index]);
        return index;
    }
    public state(): [string, string] {
        return [this.attach_state, this.display_state];
    }
    public add_class(cls: string): void {
        this.element.classList.add(cls);
    }
    public rm_class(cls: string): void {
        this.element.classList.remove(cls);
    }
    public in_class(cls: string): boolean {
        return this.element.classList.contains(cls);
    }
    public toggle_class(cls: string): void {
        this.element.classList.toggle(cls);
    }

    constructor(injector: cssinjector.CSSInjector, id: string = "") {
        super();
        if(id != "") {
            this.id = id;;
            this.element = document.getElementById(this.id);
            if(this.element == null)
                console.error("what the fuck id");
            if(this.element.firstChild)
                this.element.removeChild(this.element.firstChild); // clean
        } else  {
            this.id = utils.makeid(16);
            this.element = document.createElement("div");
            this.element.setAttribute("id", this.id);
        }
        this.injector = injector;
        this.show();
    }
} //}

let list_active_ = "c-active";
// behavior of click list is controled by "c-active" class
export class LIST extends ControllerBase //{
{
    list_elem:        HTMLElement;
    title:            HTMLElement;
    create_node:      (string) => HTMLElement;
    constructor(injector: cssinjector.CSSInjector, id?: string) {
        super(injector, id);
        this.create_node = null;
        this.list_elem = utils.createNodeFromHtmlString("<div><ul></ul></div>").firstChild as HTMLElement;
        this.element.appendChild(this.list_elem.parentNode);
        this.list_elem.addEventListener("click", (earg: MouseEvent) => {
            let tg = earg.target as HTMLElement;
            while(tg.parentNode != this.list_elem)
                tg = tg.parentNode as HTMLElement;
            if(tg.parentNode != this.list_elem)
                return;
            let si = -1;
            let ti = -1;
            for(let i = 0; i < this.list_elem.children.length; i++) {
                if(this.list_elem.children[i].classList.contains(list_active_))
                    ti = i;
                this.list_elem.children[i].classList.remove(list_active_);
                if(this.list_elem.children[i] == tg)
                    si = i;
            }
            tg.classList.add(list_active_);
            utils.assert(si != -1);
            this.dispatchEvent(new CustomEvent("click", {detail: {target: tg, index: si}}));
            if(si != ti)
                this.dispatchEvent(new CustomEvent("change", {detail: {target: tg, index: si}}));
        });
    }

    toggle_fold(): void {
        if((this.list_elem.parentNode as HTMLElement).style.display == "none") {
            (this.list_elem.parentNode as HTMLElement).style.display = "";
            this.dispatchEvent(new CustomEvent("foldOff"));
        } else {
            (this.list_elem.parentNode as HTMLElement).style.display = "none";
            this.dispatchEvent(new CustomEvent("foldOn"));
        }
        this.dispatchEvent(new CustomEvent("foldToggle"));
        return;
    }

    private insert_sub_elem(ee: HTMLElement, index: number): void {
        let len = this.list_elem.children.length;
        if(index < 0 || index >= len) {
            this.list_elem.appendChild(ee);
            this.dispatchEvent(new CustomEvent("insert", {
                detail: {target: ee, index: this.list_elem.children.length - 1, tail: true}}));
        } else {
            this.list_elem.insertBefore(ee, this.list_elem.children[index]);
            this.dispatchEvent(new CustomEvent("insert", {
                detail: {target: ee, index: index, tail: false}}));
        }
        if(this.list_elem.children.length == 1)
            (this.list_elem.firstChild as HTMLElement).classList.add(list_active_);
    }

    private delete_sub_elem(ee: HTMLElement | number): boolean {
        let ret: boolean = false;
        let test_e: HTMLElement;
        let index: number;
        if(typeof(ee) == "number") {
            if(ee as number >= this.list_elem.children.length)
                return false;
            let rm_elem = this.list_elem.removeChild(this.list_elem.children[ee as number]);
            if(rm_elem == null) return false;
            test_e = rm_elem as HTMLElement;
            index  = ee as number;
            this.dispatchEvent(new CustomEvent("delete", {detail: {target: rm_elem, index: ee as number}}));
            ret = true;
        } else {
            let si = -1;
            for(let i = 0; i < this.list_elem.children.length; i++) {
                if(this.list_elem.children[i] == ee) {
                    si = i;
                    break;
                }
            }
            if(si == -1) return false;
            ret = this.list_elem.removeChild(ee as HTMLElement) != null;
            test_e = ee;
            index = si;
            this.dispatchEvent(new CustomEvent("delete", {detail: {target: ee, index: si}}));
        }
        if(test_e.classList.contains(list_active_) && this.list_elem.children.length != 0) {
            if(this.list_elem.children.length > index) {
                this.list_elem.children[index].classList.add(list_active_);
                this.dispatchEvent(new CustomEvent("change", {detail: {target: this.list_elem.children[index], index: index}}));
            } else {
                (this.list_elem.lastChild as HTMLElement).classList.add(list_active_);
                this.dispatchEvent(new CustomEvent("change", 
                    {detail: {target: this.list_elem.lastChild, index: this.list_elem.children.length - 1}}));
            }
        }
        return ret;
    }

    delete_active(): boolean {
        if(this.list_elem.children.length == 0) return false;
        let ss: number = -1;
        for(let i=0; i<this.list_elem.children.length; i++) {
            if(this.list_elem.children[i].classList.contains(list_active_)) {
                ss = i
                break;
            }
        }
        utils.assert(ss != -1);
        return this.delete_sub_elem(ss);
    }

    private static default_create_node(html_str: string): HTMLElement {
        return utils.createNodeFromHtmlString("<li>" + html_str + "</li>");
    }
    insert_sub_item(html_str: string, index: number, extra_info?: any): HTMLElement {
        let ccc = this.create_node || LIST.default_create_node;
        let a_e = ccc(html_str);
        utils.assert(a_e != null);
        if(a_e.nodeName.toLowerCase() != "li") {
            console.warn("here may be a problem, jsut maybe");
            return null;
        }
        if(extra_info != null) (a_e as any).extra_info = extra_info;
        this.insert_sub_elem(a_e, index);
        return a_e;
    }
    delete_sub_item(e: HTMLElement): boolean {
        return this.delete_sub_elem(e);
    }
    delete_by_index(n: number): boolean {
        return this.delete_sub_elem(n);
    }
    append_sub_item(html_str: string, extra_info?: any): HTMLElement {
        return this.insert_sub_item(html_str, this.list_elem.children.length, extra_info);
    }
    insert_sub_control(ctl: ControllerBase, index: number): ControllerBase {
        this.insert_sub_elem(ctl.element, index);
        return ctl;
    }
    delete_sub_control(ctl: ControllerBase): boolean {
        return this.delete_sub_elem(ctl.element);
    }
    append_sub_control(ctl: ControllerBase): ControllerBase {
        return this.insert_sub_control(ctl, this.list_elem.children.length);
    }
} //}

// event: click, change, delete, insert
export class Menu extends LIST //{
{
    new_button: HTMLElement = null;
    in_new:     boolean = false;
    constructor(injector: cssinjector.CSSInjector, title: string, id?: string, new_button: boolean = false) {
        super(injector, id);
        this.title = utils.createNodeFromHtmlString("<span>" + title + "</span>");
        this.title.addEventListener("click", () => {
            this.toggle_fold();
        });
        if(this.title == null) console.error("debug");
        this.element.insertBefore(this.title, this.element.firstChild);
        if(new_button) this.add_new_option();
    }

    private add_new_option(): void // call only once
    {
        let new_opt = utils.createNodeFromHtmlString("<ul><li><a href='###'>" + "new" + "</a></li></ul>");
        this.new_button = new_opt;
        this.list_elem.parentNode.appendChild(this.new_button);
        this.new_button.addEventListener("click", (() => {
            if(this.in_new) return;
            this.in_new = true;
            let nn_input: HTMLInputElement = (utils.createNodeFromHtmlString(`<li><input type='text'/></li>`) as Element)
                .firstChild as HTMLInputElement;
            this.new_button.insertBefore(nn_input.parentNode, this.new_button.firstChild);
            nn_input.addEventListener("keydown", (earg: KeyboardEvent) => {
                if(earg.code.toLowerCase() != "enter") return;
                if(nn_input.value == "") this.delete_new_input();
                this.insert_sub_item(`<a href="#${nn_input.value}">${nn_input.value}</a>`, -1);
                this.dispatchEvent(new CustomEvent("new-item", 
                    {detail: {target: this.list_elem.lastChild, index: this.list_elem.children.length - 1, last: true}}));
                this.delete_new_input();
                earg.preventDefault();
            });
            let ff = (() => {
                if(this.in_new && (this.new_button.firstChild.firstChild as HTMLInputElement).value == "")
                    this.delete_new_input();
                else window.setTimeout(ff, 5 * 1000);
            }).bind(this);
            window.setTimeout(ff, 5 * 1000);
        }).bind(this));
    }

    private delete_new_input(): void {
        if(this.new_button.children.length != 2) return;
        this.new_button.removeChild(this.new_button.firstChild);
        this.in_new = false;
    }

    change_title(title: string): void {
        let node = utils.createNodeFromHtmlString("<span>" + title + "</span>");
        if(node == null) console.error("debug");
        this.element.replaceChild(node, this.element.firstChild);
    }
} //}

/*
 * only one child chan display, which controlled by style property
 */
export class MutexView extends ControllerBase //{
{
    html_node: HTMLElement;
    container: HTMLDivElement;
    /*
     * @param injector use for injecting css
     * @param template it can be a html element, a xml string, or a id of element.
     *                 if it's string, and it begin with "<", then it will be regarded as 
     *                 xml string that will be used to create node, otherwise it's a id
     */
    constructor(injector: cssinjector.CSSInjector, template: string | HTMLElement, div_id?: string) {
        super(injector, div_id);
        this.container = document.createElement("div");
        this.element.appendChild(this.container);
        if(typeof(template) == "string") {
            if((template as string).substr(0, 1) == "<") {
                this.html_node = utils.createNodeFromHtmlString(template);
            } else {
                this.html_node = document.getElementById(template);
                this.html_node.remove();
                this.html_node.setAttribute("id", "");
            }
        } else {
            utils.assert(typeof(template) == "object");
            this.html_node = template;
            this.html_node.remove();
        }
        utils.assert(this.html_node != null);
    }

    private insert_sub_elem(ee: HTMLElement, index: number): void {
        let len = this.container.children.length;
        if(index < 0 || index >= len) {
            this.container.appendChild(ee);
            this.dispatchEvent(new CustomEvent("insert", {
                detail: {target: ee, index: this.container.children.length - 1, tail: true}}));
        } else {
            this.container.insertBefore(ee, this.container.children[index]);
            this.dispatchEvent(new CustomEvent("insert", {
                detail: {target: ee, index: index, tail: false}}));
        }
    }
    new_with_template(index: number): HTMLElement {
        let div = this.html_node.cloneNode(true) as HTMLElement;
        if(this.container.children.length > 0)
            div.style.display = "none";
        this.insert_sub_elem(div, index);
        return div;
    }
    delete_with_index(index: number): boolean {
        return this.delete_sub_elem(index);
    }
    get_child_with_index(index: number): Element {
        if(this.container.children.length <= index) return null;
        return this.container.children[index] as Element;
    }
    activate(index: number): boolean {
        if(this.container.children.length <= index) return false;
        this.clean_all();
        (this.container.children[index] as HTMLElement).style.display = "";
        this.dispatchEvent(new CustomEvent("active", {detail: {target: this.container.children[index], index: index}}));
        return true;
    }
    private clean_all() {
        for(let i = 0; i<this.container.children.length; ++i)
            (this.container.children[i] as HTMLElement).style.display = "none";
    }
    private delete_sub_elem(ee: HTMLElement | number): boolean {
        if(typeof(ee) == "number") {
            if(ee as number >= this.container.children.length)
                return false;
            let rm_elem = this.container.removeChild(this.container.children[ee as number]);
            if(rm_elem == null) return false;
            this.dispatchEvent(new CustomEvent("delete", {detail: {target: rm_elem, index: ee as number}}));
            return true;
        } else {
            let si = -1;
            for(let i = 0; i < this.container.children.length; i++) {
                if(this.container.children[i] == ee) {
                    si = i;
                    break;
                }
            }
            if(si == -1) return false;
            let ret = this.container.removeChild(ee as HTMLElement) != null;
            this.dispatchEvent(new CustomEvent("delete", {detail: {target: ee, index: si}}));
            return ret;
        }
    }
} //}
