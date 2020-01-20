// reference to server selector
interface ELEM {
    server_list_elem:     HTMLElement;
    subscriptions_group:  HTMLElement;
    links_group:          HTMLElement;
    config_submit_button: HTMLButtonElement;
    config_reset_button:  HTMLButtonElement;
    config_delete_button: HTMLButtonElement;
    subs_new_button:      HTMLButtonElement;
    subs_update_button:   HTMLButtonElement;
    subs_delete_button:   HTMLButtonElement;
    subs_syncro_button:   HTMLButtonElement;
    subs_confirm_button:  HTMLButtonElement;
    test_button:          HTMLButtonElement;
    test_output:          HTMLTextAreaElement;
    update_info:          HTMLElement;
    address_bar:          HTMLTextAreaElement;
}
export var ElementsAccessor: ELEM;

interface VAR {
    server_index: any[];
}
// reference to variables
export var VarAccessor: VAR;

export function retry_get_elements(): void;
export function update_form_configure(): boolean;
export function update_server_list_from_form(): boolean;
export function update_server_list_when_add_new_server(): boolean;
export function delete_current_config(): void;
export function click_wrap(id: string, _class: string): boolean;
export function tab_click(id: string): boolean;
export function update_method_protocol_obfs_list(item: string): boolean;
export function update_server_list_aux_empty(): void;
export function update_server_list_select(servers: any[]): void;
export function update_server_list(json_data: any[]): boolean;
export function classify_servers_by(server_list: any[], what: string): any[];
export function classify_servers_by_group(server_list: any[]): any[];
export function classify_servers_by_subscription(server_list: any[]): any[];
export function servers_json_to_list(server_json: any[]): any[];
