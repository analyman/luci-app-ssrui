/* GFW List operation, post, delete, get */

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

//}

function map_to_params(map: Record<string, string>): string //{
{
    let ret: string = "";
    for(let i in map) {
        ret = ret + i + "=" + map[i];
    }
    return ret;
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
        xhr.open("GET", request_url + map_to_params({opcode: "2", hash: hash}));
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
        xhr.open("POST", request_url + map_to_params({opcode: "3", hash: hash}));
        xhr.onload = () => {
            if(xhr.status >= 200 && xhr.status < 300)
                resolve(xhr.response);
            else
                reject(xhr.status);
        }
        xhr.send();
    });
} //}

export function post_by_hash(hash: string, name: string, data: string): Promise<any> //{
{
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", request_url + map_to_params(
            {opcode: "4", hash: hash, name: name, data: data}
        ));
        xhr.onload = () => {
            if(xhr.status >= 200 && xhr.status < 300)
                resolve(xhr.response);
            else
                reject(xhr.status);
        }
        xhr.send();
    });
} //}

export function get_cross_domain(url: string) //{
{
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.onload = () => {
            if (xhr.status < 300 && xhr.status >= 200) 
                resolve(xhr.response)
            else
                reject(xhr.status)
        };
        xhr.send();
    });
} //}
