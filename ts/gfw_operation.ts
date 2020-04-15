/* GFW List operation, post, delete, get */
import * as upload from './uploadfile';

export var request_url = "/cgi-bin/luci/admin/services/ssrui/gfw";
// params: opcode, url_hash, name
// opcode 1: get all of the gfw list information in server
// opcode 2: get gfw list information specified by url hash [url_hash]
// opcode 3: delete a item which is specified by url hash
// opcode 4: post new item, which need url_hash, name and the posted data
// using id function as hash, because lua is so amazing in supporting bitwise operation and integer. /-_-\

export function fhash(str: string): number //{
{
    let hash: number = 0;
    for(let i = 0; i<str.length; i++) {
        let char = str.charCodeAt(i);
        hash = (hash<<5 - hash) + char;
        hash = hash & hash;
    }
    return hash;
} //}
(window as any).fhash = fhash;

function __quick_hash(c, p, s) //{
{
    return (c * (p % 0x10000) * s + c + s + p % 0x10000) % 0x100;
} //}
let hex_string = "0123456789ABCDEF";
function __eight_bit_to_hex(num: number): string //{
{
    let i = num % 0x10;
    let j = Math.floor(num / 0x10);
    return hex_string[j] + hex_string[i];
} //}
export function quick_hash(str: string): string //{
{
    let init = [
        210, 172, 214, 233, 194, 187, 154, 106,
        9,   11,  61,  3,   91,  142, 159, 26
    ];
    let state = 4903;
    let p = 0;
    let p1, p2, p3, p4;
    while (p < str.length) {
        let ccode = str.charCodeAt(p);
        p1 = ((ccode % 7)   * state + p + 1) % 0x10;
        p2 = ((ccode % 41)  * state + p + 1) % 0x10;
        p3 = ((ccode % 101) * state + p + 1) % 0x10;
        p4 = ((ccode % 139) * state + p + 1) % 0x10;
        init[p1] = __quick_hash(init[p1], p + 1, p1 + 1);
        init[p2] = __quick_hash(init[p2], p + 1, p2 + 1);
        init[p3] = __quick_hash(init[p3], p + 1, p3 + 1);
        init[p4] = __quick_hash(init[p4], p + 1, p4 + 1);
        state = (state * ccode + p + 1) % 0x10000;
        p++;
    }
    let res = ""
    for(p = 0; p<0x10; p++)
        res = res + __eight_bit_to_hex(init[p]);
    return res;
} //}
(window as any).quick_hash = quick_hash;

export function map_to_params(map: Record<string, string>): string //{
{
    if (map == null) console.error("unexpected null");
    let ret: string = "?";
    for(let i in map) {
        ret = ret + i + "=" + map[i] + "&";
    }
    return ret.substr(0, ret.length - 1);
} //}

export function get_all(): Promise<any> //{
{
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", request_url + map_to_params({opcode: "1"}));
        xhr.onload = () => {
            if(xhr.status >= 200 && xhr.status < 300)
                resolve(xhr.response); // json entry, [url, name]
            else
                reject(xhr.status);
        }
        xhr.send();
    });
} //}

export function get_by_hash(hash: string): Promise<any> //{
{
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", request_url + map_to_params({opcode: "2", hash: quick_hash(hash)}));
        xhr.onload = () => {
            if(xhr.status >= 200 && xhr.status < 300)
                resolve(xhr.response); // plain text
            else
                reject(xhr.status);
        }
        xhr.send();
    });
} //}

export function del_by_hash(hash: string): Promise<any> //{
{
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", request_url + map_to_params({opcode: "3", hash: quick_hash(hash)}));
        xhr.onload = () => {
            if(xhr.status >= 200 && xhr.status < 300)
                resolve(xhr.response);
            else
                reject(xhr.status);
        }
        xhr.send();
    });
} //}

export function post_by_hash(url: string, name: string, data: string): Promise<any> //{
{
    if (data == "") data = " ";
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", request_url + map_to_params(
            {
                opcode: "4",
                hash:   quick_hash(url),
                name:   name,
            }));
        xhr.onload = () => {
            if(xhr.status >= 200 && xhr.status < 300)
                resolve(xhr.response);
            else
                reject(xhr.status);
        }
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({
                    url: url, 
                    name: name,
                    data: data
                }));
    });
} //}

let upload_url  = "/cgi-bin/luci/admin/services/ssrui/uploadfile";
let copy_upload = "/cgi-bin/luci/admin/services/ssrui/copyfile";
let dele_upload = "/cgi-bin/luci/admin/services/ssrui/delfile";
export async function post_by_hash_2(url: string, name: string, data: string): Promise<boolean> //{
{
    if (data == "") data = " ";
    let session = new upload.UploadSession(upload_url, quick_hash(url), data);
    let rr: boolean = await session.send();
    if (rr == false) throw false;
    rr = false;
    let pr = new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        let params = {
            hash:   quick_hash(url),
            url :   url,
            name:   name,
        };
        xhr.open("POST", copy_upload + map_to_params(params));
        xhr.onload = () => {
            if(xhr.status >= 200 && xhr.status < 300)
                resolve(xhr.response);
            else
                reject(xhr.status);
        }
        xhr.send(JSON.stringify(params));
    });
    await pr.then(() => rr = true);
    if (rr == false) throw false;
    rr = false;
    pr = new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        let params = {
            hash:   quick_hash(url),
        };
        xhr.open("POST", dele_upload + map_to_params(params));
        xhr.onload = () => {
            if(xhr.status >= 200 && xhr.status < 300)
                resolve(xhr.response);
            else
                reject(xhr.status);
        }
        xhr.send(JSON.stringify(params));
    });
    await pr.then(() => rr = true);
    if (rr == false) throw false;
    return true;
} //}

export function get_cross_domain(url: string) //{
{
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = () => {
            if (xhr.status < 300 && xhr.status >= 200) 
                resolve(xhr.response)
            else
                reject(xhr.status)
        };
        xhr.send();
    });
} //}

