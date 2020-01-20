/* check validity of input */

export class ButtonValidity //{
{
    elem: HTMLInputElement | HTMLButtonElement;
    switcher: Map<HTMLInputElement, boolean>;

    constructor(elem: HTMLInputElement | HTMLButtonElement) {
        this.elem = elem;
        this.switcher = new Map<HTMLInputElement, boolean>();
    }

    notify(oe: HTMLInputElement, val: boolean): void {
        this.switcher.set(oe, val);
        this.check();
    }

    check(): void {
        let disable = false;
        this.switcher.forEach((val, key, _) => {
            if(!val) disable = true;
        });
        this.elem.disabled = disable;
    }
} //}

function check_val(input: HTMLInputElement, check: (val: string) => boolean, 
    obj: ButtonValidity, action: (bl: boolean, inp: HTMLInputElement) => void): void //{
{
    let truefalse = check(input.value);
    obj.notify(input, truefalse);
    action(truefalse, input);
} //}

export function check_when_change(input: HTMLInputElement, check: (val: string) => boolean,
    obj: ButtonValidity, action: (bl: boolean, inp: HTMLInputElement) => void): void //{
{
    input.addEventListener("input", () => {
        check_val(input, check, obj, action);
    });
    check_val(input, check, obj, action);
} //}

