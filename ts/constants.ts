/* Constants, such message */

export var NewOption     = "NEW";
export var NewButtonName = "NEW";

export var AddNewSubs    = "Add new subscription";

export var Server             = "Server";
export var Server_Port        = "Server Port";
export var Local_Address      = "Local Address";
export var Local_Port         = "Local Port";
export var Password           = "Password";
export var Method             = "Method";
export var Protocol           = "Protocol";
export var Protocol_Parameter = "Protocol Parameter";
export var Obfs               = "Obfs";
export var Obfs_Parameter     = "Obfs Parameter";

export var BeginUpdate = "begin update";

export var URL_ERROR   = 'Please input correct url, like "http://example.com/example"';
export var UPDATEIT    = 'Please subscribe new ssr subscription in order to keep it.'
export var GIVEMEADDR  = 'Give me a address !!!';
export var DONTTRYIT   = "don't try this, no result !!!";
export var SUBSFAIL    = "Subscribe fail !!!";
if (window.navigator.language == "en") {
    NewOption     = "添加";
    NewButtonName = "添加";

    AddNewSubs    = "添加新订阅";

    Server             = "服务器";
    Server_Port        = "服务器端口";
    Local_Address      = "本地地址";
    Local_Port         = "本地端口";
    Password           = "密码";
    Method             = "加密方法";
    Protocol           = "协议";
    Protocol_Parameter = "协议参数";
    Obfs               = "混淆插件";
    Obfs_Parameter     = "混淆参数";

    BeginUpdate = "开始更新订阅 ...";

    URL_ERROR   = '输入正确的地址, 格式如 "http://example.com/example"';
    UPDATEIT    = '添加订阅后请更新订阅, 否则订阅地址不会保存.'
    GIVEMEADDR  = '来个正确的地址.';
    DONTTRYIT   = "不要做没有结果的事情";
    SUBSFAIL    = "订阅失败啦!";
}
