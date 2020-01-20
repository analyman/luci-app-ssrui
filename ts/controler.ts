import * as event from "./event";
import * as cssinjector from './css_injector';
import * as utils from './utils';

/*
 * show() and hide() is implemented with "dispaly: none;",
 * and may be with css animation
 */
export class ControlerBase extends event._EventTarget //{
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

// behavior of click list is controled by "c-active" class
export class LIST extends ControlerBase //{
{
    sub_item_counter: number;
    list_elem:        HTMLElement;
    title:            HTMLElement;
    constructor(injector: cssinjector.CSSInjector, id?: string) {
        super(injector, id);
        this.sub_item_counter = 0;
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
                if(this.list_elem.children[i].classList.contains("c-active"))
                    ti = i;
                this.list_elem.children[i].classList.remove("c-active");
                if(this.list_elem.children[i] == tg)
                    si = i;
            }
            tg.classList.add("c-active");
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
    insert_sub_elem(ee: HTMLElement, index: number): void {
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
    }
    delete_sub_elem(ee: HTMLElement | number): boolean {
        if(typeof(ee) == "number") {
            if(ee as number >= this.list_elem.children.length)
                return false;
            let rm_elem = this.list_elem.removeChild(this.list_elem.children[ee as number]);
            if(rm_elem == null) return false;
            this.dispatchEvent(new CustomEvent("delete", {detail: {target: rm_elem, index: ee as number}}));
            return true;
        } else {
            let si = -1;
            for(let i = 0; i < this.list_elem.children.length; i++) {
                if(this.list_elem.children[i] == ee) {
                    si = i;
                    break;
                }
            }
            if(si == -1) return false;
            let ret = this.list_elem.removeChild(ee as HTMLElement) != null;
            this.dispatchEvent(new CustomEvent("delete", {detail: {target: ee, index: si}}));
            return ret;
        }
    }
    insert_sub_item(html_str: string, index: number): HTMLElement {
        let a_e = utils.createNodeFromHtmlString("<li>" + html_str + "</li>");
        this.insert_sub_elem(a_e, index);
        return a_e;
    }
    delete_sub_item(e: HTMLElement): boolean {
        return this.delete_sub_elem(e);
    }
    append_sub_item(html_str: string): HTMLElement {
        return this.insert_sub_item(html_str, this.sub_item_counter);
    }
    insert_sub_control(ctl: ControlerBase, index: number): ControlerBase {
        this.insert_sub_elem(ctl.element, index);
        return ctl;
    }
    delete_sub_control(ctl: ControlerBase): boolean {
        return this.delete_sub_elem(ctl.element);
    }
    append_sub_control(ctl: ControlerBase): ControlerBase {
        return this.insert_sub_control(ctl, this.sub_item_counter);
    }
} //}

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
                this.delete_new_input();
                earg.preventDefault();
            });
            let ff = (() => {
                if(this.in_new && (this.new_button.firstChild as HTMLInputElement).value == "")
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

