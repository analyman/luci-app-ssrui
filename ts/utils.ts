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

