import * as utils from './utils';
import * as event from './event';
import {map_to_params} from './gfw_operation';

/* 
 * Handshake header:
 *    Handshake
 *    Hash
 *    Max-Sequence
 *    Slice-Length
 * File slice header:
 *    Hash
 *    Sequence-Number
 */

function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
}

function consolelog(msg) {
    console.log(msg);
}

export class UploadSession extends event._EventTarget //{
{
    url:                string;
    hash:               string;
    data:               string;
    slice_size:         number;
    slice_number:       number;
    window_size:        number;
    origin_window_size: number;
    recieved:           Set<number>; // sorted
    sending:            Set<number>;
    slice_timeout:      number;
    timeout:            number;
    seq_init:           number;
    already_handshake:  boolean;
    start_time:         number; // ms
    error_num:          number;
    timeout_num:        number;
    tolerance:          number;
    try_send:           number;

    success_queue:      number[];
    finish_flag:        boolean;
    static speed_test_interval: number = 3000; // ms

    constructor(url, hash, data, slice_size = 10240, window_size = 10, timeout = 0, tolerance = 0) //{
    {
        super();
        this.url                = url;
        this.hash               = hash;
        this.data               = data;
        this.slice_size         = slice_size;
        this.window_size        = window_size;
        this.origin_window_size = window_size;
        this.recieved           = new Set<number>();
        this.sending            = new Set<number>();
        this.slice_timeout      = this.slice_size * window_size >= 5000 ? this.slice_size * window_size: 5000; // unset
        this.slice_number       = Math.ceil(data.length * 1.0 / slice_size);
        // this.seq_init          = Math.floor(Math.random() * 5000000);
        this.seq_init           = 6001030;
        this.already_handshake  = false;
        this.error_num          = 0;
        this.timeout_num        = 0;
        this.try_send           = 0;
        this.timeout            = timeout;
        this.start_time         = performance.now();
        this.tolerance          = tolerance > 0 ? tolerance : this.slice_number * 3;
        this.finish_flag        = false;
    } //}

    // statistics
    private __instant_speed(): number //{ (byte/ms)
    {
        let now__ = performance.now();
        while(this.success_queue.length != 0) {
            if (now__ - this.success_queue[0] > UploadSession.speed_test_interval)
                this.success_queue.shift();
        }
        return this.success_queue.length * this.slice_size / UploadSession.speed_test_interval;
    } //}
    private __overall_speed(): number //{ (byte/ms)
    {
        return this.recieved.size * this.slice_size / (performance.now() - this.start_time);
    } //}
    private __percent(): number //{
    {
        return this.recieved.size / this.slice_number;
    } //}
    static to_speed_str(n: number): string //{
    {
        if (n < 1)
            return (n * 1024).toFixed(2) + "b/s";
        else if (n < 1024)
            return n.toFixed(2) + "kb/s";
        else
            return (n / 1024).toFixed(2) + "mb/s";
    } //}

    private modified_window_size(): number //{
    {
        let try__ = Math.floor(this.window_size * (1 - this.error_num / this.try_send > 0 ? this.try_send : 1) * 1.3);
        if (try__ < 1) try__ = 1;
        if (try__ > this.origin_window_size * 2) try__ = this.origin_window_size * 2;
        this.window_size = try__;
        return try__;
    } //}

    private modified_slice_timeout(): number //{
    {
        return this.slice_timeout;
    } //}

    statistics(): string[] //{
    {
        let ispeed:number = this.__instant_speed();
        let ospeed: number = this.__overall_speed();
        let per_str: string = (this.__percent() * 100).toFixed(2) + "%";
        let ispeed_str: string = UploadSession.to_speed_str(ispeed);
        let ospeed_str: string = UploadSession.to_speed_str(ospeed);
        return [ispeed_str, ospeed_str, per_str];
    } //}

    private async handshake(): Promise<boolean> //{
    {
        if (this.already_handshake) return true;
        let success = false;
        let pr = new Promise((reoslve, reject) => {
            let xhr = new XMLHttpRequest();
            let params = {
                "Handshake":    "true",
                "Hash":         this.hash,
                "Max-Sequence": (this.slice_number + this.seq_init - 1).toString(),
                "Slice-Length": this.slice_number.toString()
            };
            xhr.open("POST", this.url + map_to_params(params), true);
            xhr.onload = () => {
                if (xhr.status < 300 && xhr.status >= 200) {
                    success = true;
                    reoslve(true);
                } else {
                    reject(false);
                }
            };
            xhr.send();
        });
        try {
            await pr;
        } catch (err) {
            consolelog("fuck")
        }
        if (success) this.already_handshake = true; 
        return success;
    } //}

    // this function just send request which don't check whether this request is proper
    private async sendPart(num: number): Promise<any> //{
    {
        console.debug("send {sequence: " + num + ", hash: " + this.hash + "}")
        this.try_send++;
        utils.assert(num < this.slice_number);
        this.sending.add(num);
        let pr = new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            let params = {
                "Hash": this.hash, 
                "Sequence-Number": (this.seq_init + num).toString()
            };
            xhr.open("POST", this.url + map_to_params(params), true);
            if (this.slice_timeout > 0)
                xhr.timeout = this.slice_timeout;
            xhr.onload = () => {
                if (xhr.status != 200) {
                    resolve(false);
                } else {
                    let rcv = JSON.parse(xhr.response);
                    utils.assert(parseInt(rcv["ack"]) == num + this.seq_init);
                    if (rcv["finish"] == true) {
                        this.finish_flag = true;
                        resolve(true);
                    }
                    if (rcv["holes"] != null || rcv["holes"].length != 0) {
                        let holes = (rcv["holes"] as string[]).map(x => parseInt(x)).sort();
                        for(let i = this.seq_init; i < holes[0]; i++) {
                            this.recieved.add(i);
                        }
                    }
                    resolve(true);
                }
            };
            xhr.onerror = () => {
                console.debug("erron in " + num);
                resolve(false);
            }
            xhr.onabort = () => {
                console.debug("abort " + num);
                resolve(false);
            }
            xhr.ontimeout = () => {
                this.timeout_num++;
                console.debug("timeout in " + num);
                resolve(false);
            }
            let data = this.data.slice(num * this.slice_size, (num + 1) * this.slice_size);
            xhr.setRequestHeader("Content-Type", "text/plain");
            xhr.send(data);
        });
        let rr = await pr;
        this.sending.delete(num);
        consolelog("delete " + num);
        if (rr == true) {
            this.recieved.add(num);
            this.dispatchEvent(new CustomEvent("RecieveAck", {detail: {ack: num}}));
            consolelog("recieve ack " + num);
        } else {
            this.error_num++;
        }
        return rr == true;
    } //}

    private should_send(): number[] //{
    {
        let i: number = 0;
        let res: number[] = [];
        for(;this.recieved.has(i); i++) {
            // do nothing
        }
        utils.assert(i <= this.slice_number);
        let init: number = i;
        let hw = this.modified_window_size();
        consolelog(hw.toString() + " " + this.sending.size.toString());
        for(;i < this.slice_number && res.length + this.sending.size < hw; i++) {
            if (this.sending.has(i)) continue;
            if (this.recieved.has(i)) continue;
            res.push(i);
        }
        return res;
    } //}

    async send(): Promise<boolean> //{
    {
        let hs = await this.handshake();
        this.finish_flag = false;
        if (hs == false) return false;
        let queue__ = [];
        while (this.recieved.size != this.slice_number) {
            let new__ = this.should_send();
            consolelog(JSON.stringify(new__));
            new__.map(x => {queue__.push(this.sendPart(x));});
            if (queue__.length != 0)
                await queue__.shift();
            else {
                consolelog("sleep ...");
                await sleep(2500);
            }
            if (this.finish_flag) return true; // stop loop
            if (this.timeout > 0 && performance.now() - this.start_time > this.timeout) {
                this.dispatchEvent(new CustomEvent("timeout"));
                return false;
            }
            if (this.tolerance > 0 && this.error_num > this.tolerance) {
                this.dispatchEvent(new CustomEvent("abort"));
                return false;
            }
        }
        return true;
    } //}

    skip_handshake(): void {this.already_handshake = true;}

    send_percent(): number {return (this.recieved.size / this.slice_number);}
} //}

