/* fucking */

/* activeChange, raise when the active child whose class contain active changed */
export var UActiveChange  = "UActiveChange";

/* when this event occurs, the element should update its contents */
export var UContentChange = "UContentChange";

/* server list change */
export var UServerListChange = "serverListChange";

interface _callback_attribute {
    once: boolean;
}

interface _callback {
    callback:  any;
    attribute: _callback_attribute;
}

export class _EventTarget //{
{
    listener: Record<string, _callback[]>;
    constructor() { this.listener = {};}

    addEventListener(e: string, callback: any, attr: _callback_attribute = {once: false})
    {
        if(!(e in this.listener))
            this.listener[e] = [];
        this.listener[e].push({callback: callback, attribute: attr});
    }

    removeEventListener(e: string, callback: any, attr: _callback_attribute = {once: false})
    {
        if(!(e in this.listener)) return;
        let stack: _callback[] = this.listener[e];
        for(let i = 0; i<stack.length; i++) {
            if(stack[i].callback === callback && stack[i].attribute == attr) {
                stack.splice(i, 1);
                return;
            }
        }
        return;
    }

    dispatchEvent(earg: CustomEvent)
    {
        if(!(earg.type in this.listener)) return true;
        let new_stack: _callback[] = [];
        let stack: _callback[] = this.listener[earg.type].slice();
        for(let i = 0; i<stack.length; i++) {
            stack[i].callback.call(this, earg);
            if(stack[i].attribute.once == false)
                new_stack.push(stack[i]);
        }
        this.listener[earg.type] = new_stack;
        return earg.defaultPrevented;
    }
} //}
