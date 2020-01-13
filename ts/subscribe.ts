/* SSR subscribe */

function safe_base64_decoder(str: string): string //{
{
    str.replace("-", "+");
    str.replace("_", "/");
    return window.atob(str);
} //}

export var default_local_address = "0.0.0.0";
export var default_local_port    = "1080";
// class SSRServer //{
export class SSRServer
{
    remarks:       string;
    server:        string;
    server_port:   string;
    local_address: string;
    local_port:    string;
    password:      string;
    method:        string;
    obfs:          string;
    protocol:      string;
    obfsparam:     string;
    protoparam:    string;
    group:         string;
    extra_info:    any;

    static undefined_remarks: number = 1;

    public constructor(data: any) //{
    {
        if (data["remarks"]       != null) this.remarks       = data["remarks"];       else this.remarks       = "UNKNOW " + (SSRServer.undefined_remarks++).toString();
        if (data["server" ]       != null) this.server        = data["server"];        else this.server        = "";
        if (data["server_port"]   != null) this.server_port   = data["server_port"];   else this.server_port   = "";
        if (data["local_address"] != null) this.local_address = data["local_address"]; else this.local_address = default_local_address;
        if (data["local_port"]    != null) this.local_port    = data["local_port"];    else this.local_port    = default_local_port;
        if (data["password"]      != null) this.password      = data["password"];      else this.password      = "";
        if (data["method"]        != null) this.method        = data["method"];        else this.method        = "";
        if (data["obfs"]          != null) this.obfs          = data["obfs"];          else this.obfs          = "";
        if (data["protocol"]      != null) this.protocol      = data["protocol"];      else this.protocol      = "";
        if (data["obfsparam"]     != null) this.obfsparam     = data["obfsparam"];     else this.obfsparam     = "";
        if (data["protoparam"]    != null) this.protoparam    = data["protoparam"];    else this.protoparam    = "";
        if (data["group"]         != null) this.group         = data["group"];         else this.group         = "UNDEFINED";
        this.extra_info = {};
        for(let i in data) {
            if(this[i] != null)
                break;
            this.extra_info[i] = data[i];
        }
    } //}

    public toRecord(): Record<any, any> {//{
        let result: Record<any, any> = {};
        result["remarks"]       = this.remarks;
        result["server"]        = this.server;
        result["server_port"]   = this.server_port;
        result["local_address"] = this.local_address;
        result["local_port"]    = this.local_port;
        result["password"]      = this.password;
        result["method"]        = this.method;
        result["obfs"]          = this.obfs;
        result["protocol"]      = this.protocol;
        result["obfsparam"]     = this.obfsparam;
        result["protoparam"]    = this.protoparam;
        result["gorup"]         = this.protoparam;
        for(let i in this.extra_info)
            result[i] = this.extra_info[i];
        return result;
    } //}

}; //}

// class SSRSubscription //{
export class SSRSubscription
{
    URL:       string;
    groupName: string;
    servers:   SSRServer[];
    schema:    string; 
    error_msg: string;

    static readonly MAX_AMOUNT_TO_TRY: number = 5;
    static readonly url_pattern: RegExp = new RegExp(
        /*|SCHEMA|:// |USER@|    DOMAIN     | PORT |        PATH     |  QUERY |   FRAGMENT |*/
        /^([^:]+):\/\/(\w+@)?(([\w-]+\.)+\w+)(:\d+)?((\/[\w-.]+)*\/?)(\?[^#]+)?(\#.*)?$/
        /*   1          2          3          5              6           8          9       */
    );

    public constructor(_URL: string, _groupName: string = "", _servers: SSRServer[] = []) //{
    {
        let url_match = _URL.match(SSRSubscription.url_pattern);
        if (url_match == null) throw "Invalidate URL \"" + _URL + "\"";
        this.schema = url_match[1].toLowerCase();
        if (this.schema.match(new RegExp(/(http)|(https)/)) == null) throw "unsupported protocol \"" + this.schema + "\"";
        this.URL       = _URL;
        this.groupName = _groupName;
        this.servers   = _servers;
        this.error_msg ="";
    } //}

    private subscribe(): Promise<any>  //{
    {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.timeout = 5 * 1000;
            xhr.onload = () => {
                if(xhr.status >= 200 && xhr.status < 200)
                    resolve(xhr.response);
                else
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText
                    });
            }
            xhr.onerror = () => {
                reject({
                      status: xhr.status,
                      statusText: xhr.statusText
                });
            }
            xhr.open("GET", this.URL, true);
            xhr.send(null);
        });
    } //}

    public Subscribe(): boolean //{
    {
        let res: boolean = true;
        let xhr_promise = this.subscribe();
        try {
            xhr_promise.then(response => {
                let dec1 = safe_base64_decoder(response);
                return dec1.split(/\r?\n/);
            }, error => {
                console.warn("subscribe fail, response statusText: " + error.statusText);
                throw "Network Error: " + error.toString();
            })
            .then((ssr_array: string[]) => {
                let ssrKeyValuePair = [];
                for (let i in ssrKeyValuePair) {
                    let match = ssr_array[i].match(/^ssr:\/\/(.*)/);
                    if (match) {
                        try {
                            let kv = safe_base64_decoder(match[1]);
                            ssrKeyValuePair.push(kv);
                        }
                        catch {
                            continue;
                        }
                    }
                }
                if (ssrKeyValuePair.length == 0) throw "Decode base64 fail.";
                return ssrKeyValuePair;
            })
            .then((ssr_kv: string[]): any[] => {
                return ssr_kv.map(ssr => {
                    let server = {};
                    let ss_split = ssr.split("?");
                    let main_part = ss_split[0].split(":");
                    if (main_part.length <= 6) return null;
                    server["server"]      = main_part[0];
                    server["server_port"] = main_part[1];
                    server["protocol"]    = main_part[2];
                    server["method"]      = main_part[3];
                    server["obfs"]        = main_part[4];
                    try {
                        server["password"] = safe_base64_decoder(main_part[5]);
                    } catch {return null;}
                    let kvs = ss_split[1].split("&");
                    for (let i in kvs) {
                        let kv = kvs[i].split("=");
                        if (kv.length==1)
                            server[kv[0]] = "";
                        else {
                            try  {
                                server[kv[0]] = safe_base64_decoder(kv[1]);
                            } catch {
                                server[kv[0]] = kv[1];
                            }
                        }
                    }
                    return server;
                }).filter(x => x != null);
            })
            .then((servers: any[]) => {
                if(servers.length == 0) throw "none of servers is valid";
                this.servers = servers.map(x => new SSRServer(x));
                for(let i in servers) {
                    if (servers[i]["group"] != null) {
                        this.groupName = servers[i]["group"];
                        break;
                    }
                }
            });
        }
        catch (error) {
            console.warn("subscribe fail, " + error.toString());
            this.error_msg = error.toString();
            res = false;
        }
        return res;
    } //}

    public toRecord(): Record<any, any> //{
    {
        if (this.servers.length == 0) return null;
        let server_records = this.servers.map(x => x.toRecord());
        return {
            group: this.groupName,
            server_list: server_records
        };
    } //}
}; //}
